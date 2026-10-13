export const chunkArray = <T>(array: T[], size: number): T[][] => {
  // A size of 0 or a negative one never advances `i`, so the loop below would
  // spin forever instead of returning a wrong answer -- a hang is far more
  // expensive to diagnose than a throw. NaN, Infinity and fractional sizes are
  // rejected by the same check: they all produce silently misshapen chunks.
  if (!Number.isInteger(size) || size < 1) {
    throw new Error(`chunkArray: size must be a positive integer, got ${size}`)
  }

  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}
