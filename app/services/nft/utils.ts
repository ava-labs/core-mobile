import { Erc721TokenBalance } from '@avalabs/glacier-sdk'
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

export const addMissingFields = (nft: Erc721TokenBalance, address: string) => {
  return {
    ...nft,
    uid: getNftUID(nft),
    owner: address
  } as NFTItemData
}

export const getNftUID = (nft: Erc721TokenBalance): NftUID => {
  return nft.address + nft.tokenId
}
