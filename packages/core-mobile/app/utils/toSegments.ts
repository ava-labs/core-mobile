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

  // Validate and extract segments
  const validateSegment = (index: number, name: string): string => {
    const segment = segments[index]
    if (!segment || !segment.trim() || segment !== segment.trim()) {
      throw new Error(
        `Invalid derivation path: ${path}. Segment '${name}' at position ${index} is missing or contains whitespace`
      )
    }
    return segment
  }

  const purpose = validateSegment(1, 'purpose')
  const coinType = validateSegment(2, 'coinType')
  const accountIndex = validateSegment(3, 'accountIndex')
  const change = validateSegment(4, 'change')
  const addressIndex = validateSegment(5, 'addressIndex')

  return {
    m: 'm',
    purpose,
    coinType: Number(coinType),
    accountIndex: Number(accountIndex),
    change: Number(change) as 0 | 1,
    addressIndex: Number(addressIndex)
  }
}
