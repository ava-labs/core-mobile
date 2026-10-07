import { Erc1155Token, Erc721Token } from '@avalabs/glacier-sdk'
import { ipfsResolver } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import {
  NftTokenWithBalance,
  TokenType,
  TokenWithBalance
} from '@avalabs/vm-module-types'
import GlacierService from 'services/glacier/GlacierService'
import { NftImageData, NftItem, NftItemExternalData, NftLocalId } from './types'
import NftProcessor from './NftProcessor'

const CLOUDFLARE_IPFS_URL = 'https://ipfs.io'

export const convertIPFSResolver = (url: string): string => {
  try {
    return ipfsResolver(url, CLOUDFLARE_IPFS_URL)
  } catch (e) {
    Logger.error('failed to resolve ipfs', e)
    return url
  }
}

// NFT tokenUri/image URLs are attacker-controlled: restrict local network,
// loopback, link-local, CGNAT and IPv4-mapped IPv6 hosts (CP-15105 R2-9).
const PRIVATE_IPV4_PATTERNS = [
  /^127\./, // loopback
  /^10\./, // private
  /^169\.254\./, // link-local (cloud metadata)
  /^192\.168\./, // private
  /^172\.(1[6-9]|2\d|3[0-1])\./, // private
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./ // CGNAT 100.64.0.0/10
]

const isPrivateIpv4 = (host: string): boolean =>
  host === '0.0.0.0' || PRIVATE_IPV4_PATTERNS.some(p => p.test(host))

// ::ffff:a.b.c.d or ::ffff:XXXX:XXXX (hex) -> dotted quad, else undefined
const ipv4FromMappedIpv6 = (host: string): string | undefined => {
  const dotted = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(host)
  if (dotted?.[1]) return dotted[1]
  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(host)
  if (hex?.[1] && hex[2]) {
    const hi = parseInt(hex[1], 16)
    const lo = parseInt(hex[2], 16)
    return `${Math.floor(hi / 256)}.${hi % 256}.${Math.floor(lo / 256)}.${
      lo % 256
    }`
  }
  return undefined
}

const isPrivateOrReservedHost = (hostname: string): boolean => {
  // strip one trailing dot: "localhost." resolves like "localhost"
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')

  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local')
  ) {
    return true
  }

  if (host.includes(':')) {
    const mapped = ipv4FromMappedIpv6(host)
    if (mapped) return isPrivateIpv4(mapped)
    return (
      host === '::1' ||
      host === '::' ||
      /^fe[89ab][0-9a-f]:/.test(host) || // fe80::/10 link-local
      /^f[cd]/.test(host) // fc00::/7 unique local
    )
  }

  return isPrivateIpv4(host)
}

/**
 * Validates an NFT media/metadata URL and returns the URL that may be fetched.
 * `http:` is upgraded to `https:` before the check (CP-15105 R2-10): iOS used
 * to render cleartext images via NSAllowsArbitraryLoads, Android release never
 * did; upgrading keeps most legacy assets working without allowing cleartext.
 */
export const assertSafeNftUrl = (rawUrl: string): string => {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error(`[Nft] Refusing to fetch invalid URL: ${rawUrl}`)
  }

  if (parsed.protocol === 'http:') {
    parsed.protocol = 'https:'
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(
      `[Nft] Refusing to fetch non-https URL (scheme: ${parsed.protocol})`
    )
  }

  if (isPrivateOrReservedHost(parsed.hostname)) {
    throw new Error('[Nft] Refusing to fetch private/reserved host')
  }

  return parsed.toString()
}

export const isNftTokenType = (
  type: TokenType | undefined
): type is TokenType.ERC721 | TokenType.ERC1155 => {
  return type === TokenType.ERC721 || type === TokenType.ERC1155
}

export const isNft = (
  token: TokenWithBalance
): token is NftTokenWithBalance => {
  return isNftTokenType(token.type)
}

export const getNftLocalId = (nft: {
  address: string
  tokenId: string
}): NftLocalId => {
  return nft.address + nft.tokenId
}

export const isErc1155 = (nft: NftItem): boolean => {
  return nft.type === TokenType.ERC1155
}

export const getTokenUri = ({
  tokenUri,
  tokenId
}: {
  tokenUri: string
  tokenId: string
}): string => {
  // Some Opensea ERC-1155s have an `0x{id}` placeholder in their URL
  return tokenUri.replace(/0x{id}|{id}/g, tokenId)
}

export const getNftTitle = (nftItem: NftItem): string => {
  return (
    nftItem.name || nftItem.processedMetadata?.name || nftItem.collectionName
  )
}

export const getNftImage = (nftItem: NftItem): string | undefined => {
  return nftItem.imageData?.uri
}

export async function fetchNftData(
  contractAddress: string,
  tokenId: string,
  chainId: string
): Promise<{
  result: Erc721Token | Erc1155Token
  processedMetadata: NftItemExternalData
  imageData: NftImageData
} | null> {
  const result = await GlacierService.getTokenDetails({
    address: contractAddress,
    chainId,
    tokenId
  })
  if (!result) return null

  const resolvedTokenUri = getTokenUri({ tokenUri: result.tokenUri, tokenId })
  const processedMetadata = await NftProcessor.fetchMetadata(resolvedTokenUri)
  const imageData = await NftProcessor.fetchImage(
    processedMetadata.image ||
      processedMetadata.animation_url ||
      processedMetadata.external_url
  )
  return { result, processedMetadata, imageData }
}

export const sortNftsByDateUpdated = (a: NftItem, b: NftItem): number => {
  const aTS = a.metadata?.lastUpdatedTimestamp
  const bTS = b.metadata?.lastUpdatedTimestamp

  if (aTS !== undefined && bTS !== undefined) {
    return bTS - aTS
  }

  if (aTS !== undefined) {
    return -1
  }

  if (bTS !== undefined) {
    return 1
  }

  return 0
}
