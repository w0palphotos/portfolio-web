import { furiganaGenerated, furiganaTokens } from '@/data/furigana.generated'
import { escapeHtml } from '@/utils/escapeHtml'

export interface FuriganaPart {
  text: string
  reading: string
}

const hasKanji = (value: string) => /[一-龯々]/.test(value)
const tokenKeys = Object.keys(furiganaTokens).sort((a, b) => b.length - a.length)
const tokenIndex = new Map<string, string[]>()

for (const word of tokenKeys) {
  const first = word[0]
  const bucket = tokenIndex.get(first)
  if (bucket) bucket.push(word)
  else tokenIndex.set(first, [word])
}

function tokenParts(text: string): FuriganaPart[] {
  const output: FuriganaPart[] = []
  let rest = text

  while (rest) {
    const candidates = tokenIndex.get(rest[0]) || []
    const word = candidates.find((candidate) => rest.startsWith(candidate))

    if (!word) {
      output.push({ text: rest[0], reading: '' })
      rest = rest.slice(1)
      continue
    }

    output.push({ text: word, reading: furiganaTokens[word] })
    rest = rest.slice(word.length)
  }

  return output
}

export function furiganaParts(text: string, enabled: boolean): FuriganaPart[] {
  if (!enabled || !text || !hasKanji(text)) return [{ text, reading: '' }]
  return furiganaGenerated[text] ?? tokenParts(text)
}

export function furiganaHtml(text: string, enabled: boolean): string {
  return furiganaParts(text, enabled)
    .map((part) =>
      part.reading
        ? `<ruby>${escapeHtml(part.text)}<rt>${escapeHtml(part.reading)}</rt></ruby>`
        : escapeHtml(part.text),
    )
    .join('')
}
