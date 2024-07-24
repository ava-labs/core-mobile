import { Network } from '@avalabs/chains-sdk'

export type ChainID = number

export type Networks = { [chainId: ChainID]: Network }

export type NetworkState = {
  customNetworks: Networks
  favorites: ChainID[]
  active: ChainID
}

export enum TokenSymbol {
  AVAX = 'AVAX',
  ETH = 'ETH',
  BTC = 'BTC'
}
