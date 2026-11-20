import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ansiToHtml } from '@/utils/ansi'
import { useI18n } from '@/i18n'

export interface Line {
  text: string
  type: 'output' | 'input' | 'system' | 'error'
}

const API = '/api/terminal'
const POLL_MS = 1000
const TIMEOUT_MS = 25_000

// `desc` holds an i18n key; command names stay literal. Flags are validated
// per-command by the API, so the list here is just bare command names.
export const SHELL_COMMANDS = [
  { name: 'fastfetch', desc: 'terminal.cmd.fastfetch' },
  { name: 'top', desc: 'terminal.cmd.top' },
  { name: 'df', desc: 'terminal.cmd.df' },
  { name: 'free', desc: 'terminal.cmd.free' },
  { name: 'uptime', desc: 'terminal.cmd.uptime' },
  { name: 'uname', desc: 'terminal.cmd.uname' },
  { name: 'hostname', desc: 'terminal.cmd.hostname' },
  { name: 'date', desc: 'terminal.cmd.date' },
  { name: 'lsblk', desc: 'terminal.cmd.lsblk' },
  { name: 'lscpu', desc: 'terminal.cmd.lscpu' },
  { name: 'vmstat', desc: 'terminal.cmd.vmstat' },
  { name: 'whoami', desc: 'terminal.cmd.whoami' },
  { name: 'id', desc: 'terminal.cmd.id' },
  { name: 'groups', desc: 'terminal.cmd.groups' },
  { name: 'who', desc: 'terminal.cmd.who' },
  { name: 'w', desc: 'terminal.cmd.w' },
  { name: 'users', desc: 'terminal.cmd.users' },
  { name: 'logname', desc: 'terminal.cmd.logname' },
  { name: 'tty', desc: 'terminal.cmd.tty' },
  { name: 'pwd', desc: 'terminal.cmd.pwd' },
  { name: 'arch', desc: 'terminal.cmd.arch' },
  { name: 'nproc', desc: 'terminal.cmd.nproc' },
  { name: 'cal', desc: 'terminal.cmd.cal' },
  { name: 'echo', desc: 'terminal.cmd.echo' },
  { name: 'help', desc: 'terminal.cmd.help' },
  { name: 'clear', desc: 'terminal.cmd.clear' },
]

function inputLine(command: string): Line {
  return {
    text: `\x1b[92mguest@takamatsu\x1b[0m:\x1b[94m~\x1b[0m$ ${command}`,
    type: 'input',
  }
}

export function useHomelabShell() {
  const { t } = useI18n()

  const banner = `\x1b[92m${t('terminal.banner1')}\x1b[0m\n\x1b[90m${t('terminal.banner2')}\x1b[0m\n${t('terminal.banner3')}`

  function buildHelp(): string {
    const rows = SHELL_COMMANDS.filter((c) => !['help', 'clear'].includes(c.name))
      .map((c) => `  \x1b[97m${c.name.padEnd(12)}\x1b[0m ${t(c.desc)}`)
      .join('\n')
    return `\x1b[94m${t('terminal.helpHomelab')}\x1b[0m\n${rows}\n\n\x1b[94m${t('terminal.helpShell')}\x1b[0m\n  \x1b[97mhelp\x1b[0m        ${t('terminal.cmd.help')}\n  \x1b[97mclear\x1b[0m       ${t('terminal.cmd.clear')}\n\n\x1b[90m${t('terminal.helpFooter')}\x1b[0m`
  }

  const lines = ref<Line[]>([{ text: banner, type: 'system' }])
  const currentInput = ref('')
  const busy = ref(false)
  const commandHistory = ref<string[]>([])
  const historyIndex = ref(-1)
  const outputRef = ref<HTMLElement | null>(null)
  let disposed = false
  let pollTimer: ReturnType<typeof setTimeout> | null = null

  const prompt = computed(() => 'guest@takamatsu ~')

  function scrollToBottom() {
    nextTick(() => {
      if (outputRef.value) {
        outputRef.value.scrollTop = outputRef.value.scrollHeight
      }
    })
  }

  // Lab presence hint in the banner (best-effort, non-blocking)
  onMounted(async () => {
    try {
      const res = await fetch('/api/homelab', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const host = data.hostname || 'homelab'
        const text = data.online
          ? `\x1b[90m${t('terminal.lab')}: \x1b[0m\x1b[92m${t('terminal.online')}\x1b[0m \x1b[90m(${host})\x1b[0m`
          : `\x1b[90m${t('terminal.lab')}: \x1b[0m\x1b[91m${t('terminal.offline')}\x1b[0m \x1b[90m(${t('terminal.offlineNote')})\x1b[0m`
        lines.value.push({ text, type: 'system' })
        scrollToBottom()
      }
    } catch {
      // banner stays as-is
    }
  })

  onUnmounted(() => {
    disposed = true
    if (pollTimer) clearTimeout(pollTimer)
  })

  function pushOutput(line: Line) {
    lines.value.push(line)
    scrollToBottom()
  }

  async function runRemote(command: string) {
    busy.value = true
    const pending: Line = { text: `\x1b[90m${t('terminal.running', { cmd: command })}\x1b[0m`, type: 'system' }
    lines.value.push(pending)
    scrollToBottom()

    const replacePending = (line: Line) => {
      const idx = lines.value.indexOf(pending)
      if (idx >= 0) lines.value.splice(idx, 1, line)
      else lines.value.push(line)
      scrollToBottom()
    }

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', command }),
      })
      const data = await res.json()
      if (!res.ok) {
        replacePending({ text: data.error || t('terminal.requestFailed', { status: res.status }), type: 'error' })
        return
      }

      const started = Date.now()
      const poll = async () => {
        if (disposed) return
        try {
          const r = await fetch(`${API}?id=${encodeURIComponent(data.id)}`, { cache: 'no-store' })
          if (r.ok) {
            const result = await r.json()
            if (result.status === 'done') {
              const output = (result.output || '').replace(/\s+$/, '')
              replacePending({
                text: output || t('terminal.noOutput'),
                type: result.exitCode === 0 ? 'output' : 'error',
              })
              return
            }
          }
        } catch {
          // keep polling until timeout
        }
        if (Date.now() - started > TIMEOUT_MS) {
          replacePending({ text: t('terminal.noResponse'), type: 'error' })
          return
        }
        pollTimer = setTimeout(poll, POLL_MS)
      }
      pollTimer = setTimeout(poll, POLL_MS)
    } catch {
      replacePending({ text: t('terminal.apiUnreachable'), type: 'error' })
    } finally {
      busy.value = false
    }
  }

  function execute() {
    const raw = currentInput.value.trim()
    if (!raw || busy.value) return

    commandHistory.value.push(raw)
    historyIndex.value = commandHistory.value.length
    currentInput.value = ''

    // Lowercase only the command name; keep flag/format case (df -T, date +%Y).
    const trimmed = raw.replace(/\s+/g, ' ')
    const sp = trimmed.indexOf(' ')
    const cmdName = (sp < 0 ? trimmed : trimmed.slice(0, sp)).toLowerCase()
    const argsStr = sp < 0 ? '' : trimmed.slice(sp + 1)
    const normalized = cmdName + (argsStr ? ' ' + argsStr : '')
    lines.value.push(inputLine(raw))

    if (cmdName === 'clear') {
      lines.value = []
      scrollToBottom()
      return
    }
    if (cmdName === 'help') {
      pushOutput({ text: buildHelp(), type: 'output' })
      return
    }
    if (cmdName === 'history') {
      const hist = commandHistory.value.map((c, i) => `  ${String(i + 1).padStart(4)}  ${c}`)
      pushOutput({ text: hist.join('\n') || `  ${t('terminal.noHistory')}`, type: 'output' })
      return
    }

    const known = SHELL_COMMANDS.some((c) => c.name === cmdName)
    if (!known) {
      pushOutput({ text: t('terminal.notAllowed', { cmd: cmdName }), type: 'error' })
      return
    }

    runRemote(normalized)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      execute()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.value.length === 0) return
      historyIndex.value = Math.max(0, historyIndex.value - 1)
      currentInput.value = commandHistory.value[historyIndex.value]
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex.value >= commandHistory.value.length - 1) {
        historyIndex.value = commandHistory.value.length
        currentInput.value = ''
        return
      }
      historyIndex.value = Math.min(commandHistory.value.length - 1, historyIndex.value + 1)
      currentInput.value = commandHistory.value[historyIndex.value]
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const partial = currentInput.value.toLowerCase()
      if (!partial) return
      const match = SHELL_COMMANDS.find((c) => c.name.startsWith(partial))
      if (match) currentInput.value = match.name
    }
  }

  function focus() {
    nextTick(() => {
      const input = document.querySelector<HTMLInputElement>('.terminal-input')
      input?.focus()
    })
  }

  return {
    lines,
    currentInput,
    busy,
    outputRef,
    execute,
    handleKeydown,
    focus,
    prompt,
    ansiToHtml,
  }
}
