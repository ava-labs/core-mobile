import { Network } from '@avalabs/chains-sdk'

export type ChainID = number

export type NetworkState = {
  networks: Record<ChainID, Network>
  customNetworks: Record<ChainID, Network>
  favorites: ChainID[]
  active: ChainID
}

export enum TokenSymbol {
  AVAX = 'AVAX',
  ETH = 'ETH',
  BTC = 'BTC'
}
