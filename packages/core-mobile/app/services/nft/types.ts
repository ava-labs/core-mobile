import { NftTokenWithBalance } from '@avalabs/vm-module-types'
import { NftContentType } from 'store/nft'

export type NftLocalId = string

export type NftImageData = {
  aspect: number
  isSvg: boolean
  image: string
  video?: string
  type: NftContentType
}

export enum NftLocalStatus {
  Unprocessed = 'Unprocessed',
  Processed = 'Processed',
  Unprocessable = 'Unprocessable'
}

export type UnprocessedNftItem = NftTokenWithBalance & {
  localId: string // address + tokenId
}

export type NftItem = UnprocessedNftItem & {
  chainId: number
  imageData?: NftImageData
  processedMetadata?: NftItemExternalData
  status?: NftLocalStatus
}

export type NftItemExternalData = {
  name: string
  image: string
  image_256: string
  attributes: NftItemExternalDataAttribute[]
  description: string
  external_url: string
  animation_url: string | null
}

export type NftItemExternalDataAttribute = {
  trait_type: string
  value: string
  percentOwned: number
}
