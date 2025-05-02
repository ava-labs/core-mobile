import {
  Erc1155TokenBalance,
  Erc1155TokenMetadata,
  Erc721TokenBalance,
  Erc721TokenMetadata
} from '@avalabs/glacier-sdk'
import { NftItemExternalDataAttribute, NftLocalId } from 'services/nft/types'

export const initialState = {
  hiddenNfts: {}
} as NftState

export type NftState = {
  hiddenNfts: Record<NftLocalId, boolean>
}

export type NftTokenTypes = Erc721TokenBalance | Erc1155TokenBalance

export type NFTItemData = NftTokenTypes & {
  owner: string
  uid: string
}

export enum NftContentType {
  Unknown = 'unknown',
  MP4 = 'video/mp4',
  JPG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  SVG = 'image/svg+xml'
}

export type NFTImageData = {
  aspect: number
  isSvg: boolean
  image?: string
  video?: string
  type?: NftContentType
}

export type NFTMetadata = (Erc721TokenMetadata | Erc1155TokenMetadata) & {
  attributes: NftItemExternalDataAttribute[]
}

export type NFTItem = NFTItemData & {
  imageData: NFTImageData | undefined
  processedMetadata: NFTMetadata
}

export type NFTItemExternalData = {
  name: string
  image: string
  image_256: string
  attributes: NftItemExternalDataAttribute[]
  description: string
  external_url: string
  animation_url: string | null
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
