import { Curve } from 'utils/publicKeys'

export const toSegments = (
  path: string,
  curve?: Curve
): {
  m: 'm'
  purpose: string
  coinType: number
  accountIndex: number
  change: 0 | 1
  addressIndex: number
} => {
  const segments = path.replaceAll("'", '').split('/')
  const isED25519 = curve === Curve.ED25519
  // ED25519 (Solana) paths use 5 segments: m/purpose'/coinType'/account'/change'
  // SECP256K1 paths use 6 segments: m/purpose'/coinType'/account'/change/addressIndex
  const minSegments = isED25519 ? 5 : 6

  if (segments.length < minSegments) {
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

  const purpose = validateSegment({ index: 1, name: 'purpose', segments, path })
  const coinType = validateSegment({
    index: 2,
    name: 'coinType',
    segments,
    path
  })
  const accountIndex = validateSegment({
    index: 3,
    name: 'accountIndex',
    segments,
    path
  })
  const change = validateSegment({ index: 4, name: 'change', segments, path })
  const addressIndex =
    isED25519 && segments.length === 5
      ? 0
      : validateSegment({ index: 5, name: 'addressIndex', segments, path })

  return {
    m: 'm',
    purpose,
    coinType: Number(coinType),
    accountIndex: Number(accountIndex),
    change: Number(change) as 0 | 1,
    addressIndex: Number(addressIndex)
  }
}

export const validateSegment = ({
  index,
  name,
  segments,
  path
}: {
  index: number
  name: string
  segments: string[]
  path: string
}): string => {
  const segment = segments[index]
  if (!segment || !segment.trim() || segment !== segment.trim()) {
    throw new Error(
      `Invalid derivation path: ${path}. Segment '${name}' at position ${index} is missing or contains whitespace`
    )
  }
  return segment
}
