import { Erc1155TokenBalance, Erc721TokenBalance } from '@avalabs/glacier-sdk'
import { NFTItem, NFTItemData, NftTokenTypes } from 'store/nft'
import { ipfsResolver } from '@avalabs/utils-sdk'
import Logger from 'utils/Logger'
import { NftUID } from './types'

const CLOUDFLARE_IPFS_URL = 'https://cloudflare-ipfs.com'

export const convertIPFSResolver = (url: string): string => {
  try {
    return ipfsResolver(url, CLOUDFLARE_IPFS_URL)
  } catch (e) {
    Logger.error('failed to resolve ipfs', e)
    return url
  }
}

export const addMissingFields = (
  nft: { address: string; tokenId: string },
  address: string
): NFTItemData => {
  return {
    ...nft,
    uid: getNftUID(nft),
    owner: address
  } as NFTItemData
}

export const getNftUID = (nft: {
  address: string
  tokenId: string
}): NftUID => {
  return nft.address + nft.tokenId
}

export const isErc721 = (nft: NftTokenTypes): nft is Erc721TokenBalance => {
  return nft.ercType === 'ERC-721'
}

export const isErc1155 = (nft: NftTokenTypes): nft is Erc1155TokenBalance => {
  return nft.ercType === 'ERC-1155'
}

export const getTokenUri = (nft: NftTokenTypes): string => {
  // Some Opensea ERC-1155s have an `0x{id}` placeholder in their URL
  return nft.tokenUri.replace(/0x{id}|{id}/g, nft.tokenId)
}

export const getNftTitle = (nftItem: NFTItem): string | undefined => {
  if (isErc721(nftItem)) {
    return nftItem.name
  }

  return nftItem.processedMetadata.name ?? nftItem.metadata.name
}
