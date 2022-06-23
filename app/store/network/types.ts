import { Network } from '@avalabs/chains-sdk'

export type NetworkState = {
  networks: Record<number, Network>
  favorites: number[]
  active: number
}

export enum TokenSymbol {
  AVAX = 'AVAX',
  ETH = 'ETH',
  BTC = 'BTC'
}
