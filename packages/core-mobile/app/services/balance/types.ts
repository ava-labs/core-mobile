import { type Error } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance/types'

export type NormalizedBalancesForAccount = {
  accountId: string
  chainId: number
  accountAddress: string
  tokens: LocalTokenWithBalance[]
  dataAccurate: boolean
  error: Error | null
}
