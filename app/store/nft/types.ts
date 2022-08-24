import { Erc721TokenBalance } from '@avalabs/glacier-sdk'
import { Network } from '@avalabs/chains-sdk'
import { Account } from 'store/account'
import { NftUID } from 'services/nft/types'

export const initialState = {
  hiddenNfts: {},
  nfts: {}
} as NftState

export type NftState = {
  hiddenNfts: Record<NftUID, boolean>
  nfts: Record<NftUID, NFTItemData>
}

export type NFTItemData = Erc721TokenBalance &
  NFTItemExternalData & {
    isFullLoading: boolean
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
