export interface LinkPart {
  text: string
  to: string | null
}

const marker = /\[\[([^\]|]+)\|([^\]]+)\]\]/g

export function linkParts(text: string): LinkPart[] {
  const parts: LinkPart[] = []
  let last = 0
  for (let match = marker.exec(text); match; match = marker.exec(text)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), to: null })
    parts.push({ text: match[1], to: match[2] })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), to: null })
  return parts
}
