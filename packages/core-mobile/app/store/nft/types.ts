import {
  Erc1155TokenBalance,
  Erc721TokenBalance,
  Erc721TokenMetadata,
  Erc1155TokenMetadata
} from '@avalabs/glacier-sdk'
import { NftUID } from 'services/nft/types'

export const initialState = {
  hiddenNfts: {}
} as NftState

export type NftState = {
  hiddenNfts: Record<NftUID, boolean>
  nfts: Record<NftUID, NFTItemData>
}

export type NftTokenTypes = Erc721TokenBalance | Erc1155TokenBalance

export type NFTItemData = NftTokenTypes & {
  owner: string
  uid: string
}

export type NFTImageData = {
  aspect: number
  isSvg: boolean
  image: string
}

export type NFTMetadata = (Erc721TokenMetadata | Erc1155TokenMetadata) & {
  attributes: NFTItemExternalDataAttribute[]
}

export type NFTItem = NFTItemData & {
  imageData: NFTImageData | undefined
  processedMetadata: NFTMetadata
}

export type NFTItemExternalData = {
  name: string
  image: string
  image_256: string
  attributes: NFTItemExternalDataAttribute[]
  description: string
  external_url: string
  animation_url: string | null
}

export type NFTItemExternalDataAttribute = {
  trait_type: string
  value: string
  percentOwned: number
}

export type NftResponse = {
  nfts: NFTItemData[]
  nextPageToken?: NftPageParam
}

export type NftPageParam =
  | {
      erc1155?: string
      erc721?: string
    }
  | string
