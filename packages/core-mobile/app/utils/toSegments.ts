export const toSegments = (
  path: string
): {
  m: 'm'
  purpose: string
  coinType: number
  account: number
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

  const purpose = segments[1]
  const coinType = segments[2]
  const account = segments[3]
  const change = segments[4]
  const addressIndex = segments[5]

  // protect against empty segments and whitespace
  if (
    !purpose?.trim() ||
    !coinType?.trim() ||
    !account?.trim() ||
    !change?.trim() ||
    !addressIndex?.trim()
  ) {
    throw new Error(
      `Invalid derivation path segments: ${path}. All segments must be present and non-empty`
    )
  }

  return {
    m: 'm',
    purpose,
    coinType: Number(coinType),
    account: Number(account),
    change: Number(change) as 0 | 1,
    addressIndex: Number(addressIndex)
  }
}
