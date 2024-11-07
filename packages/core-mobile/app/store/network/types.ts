import { Network } from '@avalabs/core-chains-sdk'

export type ChainID = number

export type NetworkWithCaipId = Network & { caipId?: string }

export type Networks = { [chainId: ChainID]: NetworkWithCaipId }

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
