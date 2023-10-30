import { pvm } from '@avalabs/avalanchejs-v2'
import {
  AVALANCHE_MAINNET_API_URL,
  AVALANCHE_TESTNET_API_URL
} from './constants'

export const getPvmApi = (isTestnet: boolean): pvm.PVMApi =>
  new pvm.PVMApi(
    isTestnet ? AVALANCHE_TESTNET_API_URL : AVALANCHE_MAINNET_API_URL
  )
