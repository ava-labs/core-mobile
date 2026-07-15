/**
 * Minimal Markdown → Atlassian Document Format (ADF) converter
 * for bug ticket descriptions (headings, lists, bold/italic, links, paragraphs).
 */

type AdfMark =
  | { type: 'strong' }
  | { type: 'em' }
  | { type: 'code' }
  | { type: 'link'; attrs: { href: string } }
type AdfText = { type: 'text'; text: string; marks?: AdfMark[] }
type AdfNode = Record<string, unknown>

function inlineMarks(text: string): AdfText[] {
  // Parse **bold**, *italic*, `code`, and [label](url) left-to-right
  const nodes: AdfText[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push({ type: 'text', text: text.slice(last, match.index) })
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push({ type: 'text', text: token.slice(2, -2), marks: [{ type: 'strong' }] })
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push({ type: 'text', text: token.slice(1, -1), marks: [{ type: 'code' }] })
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push({ type: 'text', text: token.slice(1, -1), marks: [{ type: 'em' }] })
    } else {
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (m) {
        nodes.push({
          type: 'text',
          text: m[1]!,
          marks: [{ type: 'link', attrs: { href: m[2]! } }],
        })
      }
    }
    last = match.index + token.length
  }
  if (last < text.length) {
    nodes.push({ type: 'text', text: text.slice(last) })
  }
  return nodes.length > 0 ? nodes : [{ type: 'text', text }]
}

function paragraph(text: string): AdfNode {
  return { type: 'paragraph', content: inlineMarks(text) }
}

function heading(text: string, level: number): AdfNode {
  // Strip trailing colon and markdown bold wrappers from headings
  const clean = text
    .replace(/^\*\*(.+)\*\*:?$/, '$1')
    .replace(/:$/, '')
    .trim()
  return {
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text: clean, marks: [{ type: 'strong' }] }],
  }
}

function listItem(text: string): AdfNode {
  return {
    type: 'listItem',
    content: [paragraph(text)],
  }
}

/** Convert section labels like "**Steps to Reproduce:**" into headings */
function normalizeHeadingLine(line: string): string | null {
  const trimmed = line.trim()
  const mdHeading = trimmed.match(/^(#{1,3})\s+(.+)$/)
  if (mdHeading) return mdHeading[2]!

  // **Notes:** / **Notes.** / **Expected Result:**
  const boldLabel = trimmed.match(/^\*\*(.+?)\*\*[.:]?\s*$/)
  if (boldLabel) return boldLabel[1]!

  // "Steps to Reproduce:" plain label ending with colon/period, short line
  if (/^[A-Za-z][A-Za-z0-9 /&-]{2,40}[.:]\s*$/.test(trimmed)) {
    return trimmed.replace(/[.:]$/, '')
  }

  return null
}

export function markdownToAdf(markdown: string): AdfNode[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const content: AdfNode[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    const headingText = normalizeHeadingLine(trimmed)
    if (headingText && !trimmed.startsWith('- ') && !/^\d+\.\s/.test(trimmed)) {
      content.push(heading(headingText, 3))
      i++
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: AdfNode[] = []
      while (i < lines.length) {
        const l = (lines[i] ?? '').trim()
        const m = l.match(/^\d+\.\s+(.*)$/)
        if (!m) break
        items.push(listItem(m[1]!))
        i++
      }
      content.push({ type: 'orderedList', attrs: { order: 1 }, content: items })
      continue
    }

    // Bullet list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: AdfNode[] = []
      while (i < lines.length) {
        const l = (lines[i] ?? '').trim()
        const m = l.match(/^[-*]\s+(.*)$/)
        if (!m) break
        items.push(listItem(m[1]!))
        i++
      }
      content.push({ type: 'bulletList', content: items })
      continue
    }

    // Paragraph (merge consecutive non-empty non-special lines)
    const paraLines: string[] = [trimmed]
    i++
    while (i < lines.length) {
      const next = (lines[i] ?? '').trim()
      if (!next) break
      if (normalizeHeadingLine(next)) break
      if (/^\d+\.\s+/.test(next) || /^[-*]\s+/.test(next)) break
      paraLines.push(next)
      i++
    }
    content.push(paragraph(paraLines.join(' ')))
  }

  return content.length > 0 ? content : [paragraph(markdown || '(no description)')]
}
