export const toSegments = (
  path: string
): {
  m: 'm'
  purpose: string
  coinType: number
  accountIndex: number
  change: 0 | 1
  addressIndex: number
} => {
  const segments = path.replaceAll("'", '').split('/')

  if (segments.length < 6) {
    throw new Error(
      `Invalid derivation path: ${path}. Expected full format: m/purpose'/coinType'/account'/change/addressIndex`
    )
  }

  // Validate that path starts with 'm'
  if (segments[0] !== 'm') {
    throw new Error(
      `Invalid derivation path: ${path}. Expected full format: m/purpose'/coinType'/account'/change/addressIndex`
    )
  }

  const purpose = validateSegment(1, 'purpose', segments, path)
  const coinType = validateSegment(2, 'coinType', segments, path)
  const accountIndex = validateSegment(3, 'accountIndex', segments, path)
  const change = validateSegment(4, 'change', segments, path)
  const addressIndex = validateSegment(5, 'addressIndex', segments, path)

  return {
    m: 'm',
    purpose,
    coinType: Number(coinType),
    accountIndex: Number(accountIndex),
    change: Number(change) as 0 | 1,
    addressIndex: Number(addressIndex)
  }
}

export const validateSegment = (
  index: number,
  name: string,
  segments: string[],
  path: string
): string => {
  const segment = segments[index]
  if (!segment || !segment.trim() || segment !== segment.trim()) {
    throw new Error(
      `Invalid derivation path: ${path}. Segment '${name}' at position ${index} is missing or contains whitespace`
    )
  }
  return segment
}
