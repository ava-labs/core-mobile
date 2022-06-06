import { Network } from '@avalabs/chains-sdk'

export type NetworkState = {
  networks: Record<string, Network>
  favorites: string[]
  active: number
}

export enum TokenSymbol {
  AVAX = 'AVAX',
  ETH = 'ETH',
  BTC = 'BTC'
}
