import { pvm } from '@avalabs/avalanchejs'
import {
  AVALANCHE_DEVNET_API_URL,
  AVALANCHE_MAINNET_API_URL,
  AVALANCHE_TESTNET_API_URL
} from './constants'

export const getPvmApi = (isTestnet: boolean, isDevnet: boolean): pvm.PVMApi =>
  new pvm.PVMApi(
    isDevnet
      ? AVALANCHE_DEVNET_API_URL
      : isTestnet
      ? AVALANCHE_TESTNET_API_URL
      : AVALANCHE_MAINNET_API_URL
  )
