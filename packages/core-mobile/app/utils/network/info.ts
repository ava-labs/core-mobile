import { info } from '@avalabs/avalanchejs'
import {
  AVALANCHE_MAINNET_API_URL,
  AVALANCHE_TESTNET_API_URL
} from './constants'

export const getInfoApi = (isTestnet: boolean): info.InfoApi =>
  new info.InfoApi(
    isTestnet ? AVALANCHE_TESTNET_API_URL : AVALANCHE_MAINNET_API_URL
  )
