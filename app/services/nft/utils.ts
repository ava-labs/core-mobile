import { Erc721TokenBalance } from '@avalabs/glacier-sdk'
import { NFTItemData } from 'store/nft'
import NftProcessor from './NftProcessor'
import { NftUID } from './types'

const CLOUDFLARE_IPFS_URL = 'https://cloudflare-ipfs.com/ipfs'

export const convertIPFSResolver = (url: string) => {
  if (url.startsWith('ipfs://')) {
    // handle direct ipfs links
    return url.replace('ipfs://', `${CLOUDFLARE_IPFS_URL}/`)
  } else if (url.includes('ipfs')) {
    // handle ipfs links that use some resolver
    const ipfsHash = url.split('/').pop()
    /**
     * Converting everything to cloudflare because some ipfs resolver try and rate limit
     *
     * Sometimes cloudflare was slow to resolve so if this becomes an issue we can sart using infura. Which seemed to
     * be faster but clooudflare seems like the more stable solution.
     */
    return `${CLOUDFLARE_IPFS_URL}/${ipfsHash}`
  }

  return url
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

export const addMissingFields = (address: string) => {
  return (nft: NFTItemData) => ({
    ...nft,
    uid: getNftUID(nft),
    owner: address
  })
}

export const getNftUID = (nft: Erc721TokenBalance): NftUID => {
  return nft.address + nft.tokenId
}
