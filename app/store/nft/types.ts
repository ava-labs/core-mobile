import { Erc721TokenBalanceDto } from '@avalabs/glacier-sdk'

export const initialState = {
  collection: {}
} as NftState

export type NftState = {
  collection: {
    [chainId: string]: {
      [contractAddress: string]: { [tokenId: string]: NFTItemData }
    }
  }
}

export type NFTItemData = Erc721TokenBalanceDto &
  NFTItemExternalData & {
    isShowing: boolean
    aspect: number
    owner: string
    uid: string
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
