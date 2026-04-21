import { NftTokenWithBalance } from '@avalabs/vm-module-types'

export enum NftContentType {
  Unknown = 'unknown',
  MP4 = 'video/mp4',
  JPG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  SVG = 'image/svg+xml'
}

export type NftLocalId = string

export type NftImageData = {
  uri: string
  type: NftContentType
}

export enum NftLocalStatus {
  Unprocessed = 'Unprocessed',
  Processed = 'Processed',
  Unprocessable = 'Unprocessable'
}

export type UnprocessedNftItem = NftTokenWithBalance & {
  networkChainId: number
  localId: string // address + tokenId
}

export type NftItem = UnprocessedNftItem & {
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
  animation_url: string | undefined
}

export type NftItemExternalDataAttribute = {
  display_type: string
  trait_type: string
  value: string
  percentOwned: number
}
