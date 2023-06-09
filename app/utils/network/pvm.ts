import { pvm } from '@avalabs/avalanchejs-v2'

const AVALANCHE_MAINNET_API_URL = 'https://api.avax.network'

const AVALANCHE_TESTNET_API_URL = 'https://api.avax-test.network'

export const getPvmApi = (isTestnet: boolean): pvm.PVMApi =>
  new pvm.PVMApi(
    isTestnet ? AVALANCHE_TESTNET_API_URL : AVALANCHE_MAINNET_API_URL
  )
