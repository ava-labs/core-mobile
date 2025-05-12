export function toSentenceCase(input: string): string {
  if (input.length === 0) {
    return input
  }

  const lower = input.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}
