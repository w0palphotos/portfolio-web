// ANSI SGR → HTML for terminal output. Supports basic 16 colors, 256-color
// (38;5;N / 48;5;N) and truecolor (38;2;R;G;B), bold/dim/underline.
// Output is always rendered on the dark terminal surface, so colors are
// fixed (Catppuccin Mocha flavored) rather than theme variables.
import { escapeHtml } from '@/utils/escapeHtml'

const BASIC_FG: Record<number, string> = {
  30: '#45475a', 31: '#f38ba8', 32: '#a6e3a1', 33: '#f9e2af',
  34: '#89b4fa', 35: '#f5c2e7', 36: '#94e2d5', 37: '#bac2de',
  90: '#585b70', 91: '#f38ba8', 92: '#a6e3a1', 93: '#f9e2af',
  94: '#89b4fa', 95: '#f5c2e7', 96: '#94e2d5', 97: '#cdd6f4',
}

const BASIC_BG: Record<number, string> = {
  40: '#45475a', 41: '#f38ba8', 42: '#a6e3a1', 43: '#f9e2af',
  44: '#89b4fa', 45: '#f5c2e7', 46: '#94e2d5', 47: '#bac2de',
  100: '#585b70', 101: '#f38ba8', 102: '#a6e3a1', 103: '#f9e2af',
  104: '#89b4fa', 105: '#f5c2e7', 106: '#94e2d5', 107: '#cdd6f4',
}

function color256(n: number): string {
  if (n < 16) {
    const fg = BASIC_FG[n < 8 ? 30 + n : 90 + (n - 8)]
    return fg || '#cdd6f4'
  }
  if (n < 232) {
    const i = n - 16
    const steps = [0, 95, 135, 175, 215, 255]
    const r = steps[Math.floor(i / 36)]
    const g = steps[Math.floor((i % 36) / 6)]
    const b = steps[i % 6]
    return `rgb(${r},${g},${b})`
  }
  const v = 8 + (n - 232) * 10
  return `rgb(${v},${v},${v})`
}

interface Style {
  color: string | null
  background: string | null
  bold: boolean
  dim: boolean
  underline: boolean
}

function styleAttr(s: Style): string {
  const parts: string[] = []
  if (s.color) parts.push(`color:${s.color}`)
  if (s.background) parts.push(`background:${s.background}`)
  if (s.bold) parts.push('font-weight:700')
  if (s.dim) parts.push('opacity:0.7')
  if (s.underline) parts.push('text-decoration:underline')
  return parts.join(';')
}

export function ansiToHtml(text: string, options: { preEscaped?: boolean } = {}): string {
  const escaped = options.preEscaped ? text : escapeHtml(text)
  const segments = escaped.split(/(\x1b\[[0-9;]*m)/)
  const style: Style = { color: null, background: null, bold: false, dim: false, underline: false }
  const out: string[] = []

  for (const seg of segments) {
    const m = seg.match(/^\x1b\[([0-9;]*)m$/)
    if (m) {
      const codes = (m[1] || '0').split(';').map((c) => parseInt(c, 10))
      for (let i = 0; i < codes.length; i++) {
        const code = Number.isNaN(codes[i]) ? 0 : codes[i]
        if (code === 0) {
          style.color = null
          style.background = null
          style.bold = false
          style.dim = false
          style.underline = false
        } else if (code === 1) style.bold = true
        else if (code === 2) style.dim = true
        else if (code === 4) style.underline = true
        else if (code === 22) { style.bold = false; style.dim = false }
        else if (code === 24) style.underline = false
        else if (code === 39) style.color = null
        else if (code === 49) style.background = null
        else if (BASIC_FG[code]) style.color = BASIC_FG[code]
        else if (BASIC_BG[code]) style.background = BASIC_BG[code]
        else if (code === 38 || code === 48) {
          const target = code === 38 ? 'color' : 'background'
          const mode = codes[i + 1]
          if (mode === 5 && codes.length > i + 2) {
            style[target] = color256(codes[i + 2])
            i += 2
          } else if (mode === 2 && codes.length > i + 4) {
            style[target] = `rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`
            i += 4
          }
        }
      }
      continue
    }
    if (!seg) continue
    const attr = styleAttr(style)
    out.push(attr ? `<span style="${attr}">${seg}</span>` : seg)
  }

  return out.join('').replace(/\n/g, '<br>')
}
