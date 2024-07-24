import { Info } from '@avalabs/avalanchejs'
import {
  AVALANCHE_MAINNET_API_URL,
  AVALANCHE_TESTNET_API_URL
} from './constants'

export const getInfoApi = (isTestnet: boolean): Info =>
  new Info(isTestnet ? AVALANCHE_TESTNET_API_URL : AVALANCHE_MAINNET_API_URL)
