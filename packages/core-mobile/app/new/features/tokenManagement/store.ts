import { Network } from '@avalabs/core-chains-sdk'
import { createZustandStore } from 'common/utils/createZustandStore'

export const useTokenAddress = createZustandStore<string>('')

export const useNetwork = createZustandStore<Network | undefined>(undefined)
