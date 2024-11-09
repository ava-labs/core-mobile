import { info } from '@avalabs/avalanchejs'
import {
  AVALANCHE_DEVNET_API_URL,
  AVALANCHE_MAINNET_API_URL,
  AVALANCHE_TESTNET_API_URL
} from './constants'

export const getInfoApi = (
  isTestnet: boolean,
  isDevnet: boolean
): info.InfoApi =>
  new info.InfoApi(
    isDevnet
      ? AVALANCHE_DEVNET_API_URL
      : isTestnet
      ? AVALANCHE_TESTNET_API_URL
      : AVALANCHE_MAINNET_API_URL
  )
