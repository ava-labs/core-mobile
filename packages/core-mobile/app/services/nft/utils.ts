import { ipfsResolver } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import {
  NftTokenWithBalance,
  TokenType,
  TokenWithBalance
} from '@avalabs/vm-module-types'
import { NftItem, NftLocalId } from './types'

const CLOUDFLARE_IPFS_URL = 'https://ipfs.io'

export const convertIPFSResolver = (url: string): string => {
  try {
    return ipfsResolver(url, CLOUDFLARE_IPFS_URL)
  } catch (e) {
    Logger.error('failed to resolve ipfs', e)
    return url
  }
}

const isNftTokenType = (type: TokenType): boolean => {
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
  return nftItem.imageData?.image
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
