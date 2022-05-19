import {
  NetworkConfig,
  MainnetConfig,
  TestnetConfig,
  BN
} from '@avalabs/avalanche-wallet-sdk'

// most of the network types are copied from
// https://github.com/ava-labs/extension-avalanche/blob/main/src/background/services/network/models.ts

const AVALANCHE_PLATFORM_ID = 'avalanche'
/**
 * This means there is no platform representation on coin gecko for this platform
 * @link https://api.coingecko.com/api/v3/asset_platforms
 */
const NULL_PLATFORM_ID = 'no-id-for-this-platform'

export type NativeToken = {
  name: string
  symbol: string
  balance?: BN
  denomination: number
  coinId: string
}

export const AVAX_TOKEN: NativeToken = {
  name: 'Avalanche',
  symbol: 'AVAX',
  balance: undefined,
  denomination: 18,
  coinId: 'avalanche-2'
}
export const BTC_TOKEN: NativeToken = {
  name: 'Bitoin',
  symbol: 'BTC',
  balance: undefined,
  denomination: 8,
  coinId: 'bitcoin'
}

export enum NetworkVM {
  EVM = 'NetworkVM:EVM',
  BITCOIN = 'NetworkVM:BITCOIN'
}

export type Network = {
  config: NetworkConfig
  name: string
  chainId: number
  nativeToken: NativeToken
  vm: NetworkVM
  platformId: string
  isTest: boolean
}

export const MAINNET_NETWORK: Network = {
  config: MainnetConfig,
  name: 'Avalanche Mainnet',
  chainId: 43114,
  nativeToken: AVAX_TOKEN,
  vm: NetworkVM.EVM,
  platformId: AVALANCHE_PLATFORM_ID,
  isTest: false
}

export const FUJI_NETWORK: Network = {
  config: TestnetConfig,
  name: 'Avalanche FUJI',
  chainId: 43113,
  nativeToken: AVAX_TOKEN,
  vm: NetworkVM.EVM,
  platformId: AVALANCHE_PLATFORM_ID,
  isTest: true
}

export const BITCOIN_NETWORK: Network = {
  config: MainnetConfig,
  name: 'Bitcoin Mainnet',
  chainId: -1,
  nativeToken: BTC_TOKEN,
  vm: NetworkVM.BITCOIN,
  platformId: NULL_PLATFORM_ID,
  isTest: false
}

export const supportedNetworks = {
  [MAINNET_NETWORK.chainId]: MAINNET_NETWORK,
  [FUJI_NETWORK.chainId]: FUJI_NETWORK,
  [BITCOIN_NETWORK.chainId]: BITCOIN_NETWORK
}

export type NetworkState = {
  networks: Record<number, Network>
  favorites: number[]
  active: number
}
