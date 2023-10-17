import { Erc1155TokenBalance, Erc721TokenBalance } from '@avalabs/glacier-sdk'
import { NFTItemData, NftTokenTypes } from 'store/nft'
import { ipfsResolver } from '@avalabs/utils-sdk'
import Logger from 'utils/Logger'
import NftProcessor from './NftProcessor'
import { NftUID } from './types'

const CLOUDFLARE_IPFS_URL = 'https://cloudflare-ipfs.com'

export const convertIPFSResolver = (url: string) => {
  try {
    return ipfsResolver(url, CLOUDFLARE_IPFS_URL)
  } catch (e) {
    Logger.error('failed to resolve ipfs', e)
    return url
  }
}

export const applyImageAndAspect = async (nft: NFTItemData) => {
  if (!nft.metadata.imageUri) {
    return nft
  }

  const [image, aspect, isSvg] = await NftProcessor.fetchImageAndAspect(
    nft.metadata.imageUri
  )

  return {
    ...nft,
    aspect,
    isSvg,
    metadata: {
      ...nft.metadata,
      imageUri: image
    }
  }
}

export const addMissingFields = (nft: NftTokenTypes, address: string) => {
  return {
    ...nft,
    uid: getNftUID(nft),
    owner: address
  } as NFTItemData
}

export const getNftUID = (nft: NftTokenTypes): NftUID => {
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
