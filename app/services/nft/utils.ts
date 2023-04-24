import { Erc1155TokenBalance, Erc721TokenBalance } from '@avalabs/glacier-sdk'
import { NFTItemData } from 'store/nft'
import { ipfsResolver } from '@avalabs/utils-sdk'
import NftProcessor from './NftProcessor'
import { NftUID } from './types'

const CLOUDFLARE_IPFS_URL = 'https://cloudflare-ipfs.com'

export const convertIPFSResolver = (url: string) => {
  try {
    return ipfsResolver(url, CLOUDFLARE_IPFS_URL)
  } catch {
    return url
  }
}

export const applyImageAndAspect = async (nftData: NFTItemData) => {
  const [image, aspect, isSvg] = await NftProcessor.fetchImageAndAspect(
    nftData.image
  )
  nftData.image = image
  nftData.aspect = aspect
  nftData.isSvg = isSvg
  return nftData
}

export const addMissingFields = (
  nft: Erc721TokenBalance | Erc1155TokenBalance,
  address: string
) => {
  return {
    ...nft,
    uid: getNftUID(nft),
    owner: address
  } as NFTItemData
}

export const getNftUID = (
  nft: Erc721TokenBalance | Erc1155TokenBalance
): NftUID => {
  return nft.address + nft.tokenId
}

export const isErc721 = (
  nft: Erc721TokenBalance | Erc1155TokenBalance
): nft is Erc721TokenBalance => {
  return nft.ercType === 'ERC-721'
}

export const isErc1155 = (
  nft: Erc721TokenBalance | Erc1155TokenBalance
): nft is Erc1155TokenBalance => {
  return nft.ercType === 'ERC-1155'
}

export const getTokenUri = (
  nft: Erc721TokenBalance | Erc1155TokenBalance
): string => {
  // Some Opensea ERC-1155s have an `0x{id}` placeholder in their URL
  return nft.tokenUri.replace(/0x{id}|{id}/g, nft.tokenId)
}
