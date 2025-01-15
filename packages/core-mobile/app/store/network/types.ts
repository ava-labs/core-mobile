import { Network } from '@avalabs/core-chains-sdk'

export type ChainID = number

export type NetworkWithCaip2ChainId = Network & { caip2ChainId?: string }

export type Networks = { [chainId: ChainID]: NetworkWithCaip2ChainId }

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

export type ChainAlias = 'X' | 'P' | 'C'
