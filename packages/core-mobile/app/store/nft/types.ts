import { NftLocalId } from 'services/nft/types'

export const initialState = {
  hiddenNfts: {}
} as NftState

export type NftState = {
  hiddenNfts: Record<NftLocalId, boolean>
}
