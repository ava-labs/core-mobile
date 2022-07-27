import { Erc721TokenBalance } from '@avalabs/glacier-sdk'
import { Network } from '@avalabs/chains-sdk'
import { Account } from 'store/account'

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

export type NFTItemData = Erc721TokenBalance &
  NFTItemExternalData & {
    isShowing: boolean
    aspect: number
    owner: string
    uid: string
    isSvg: boolean
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

export type GetNftArgs = {
  network: Network
  account: Account
  currency: string
  nextPageToken?: string
}

export type NftResponse = {
  nfts: NFTItemData[]
  nextPageToken?: string
}
