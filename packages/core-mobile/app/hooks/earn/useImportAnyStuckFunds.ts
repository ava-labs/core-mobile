import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import EarnService from 'services/earn/EarnService'
import { selectActiveAccount } from 'store/account'
import { RecoveryEvents } from 'services/earn/types'
import { selectCBaseFeeMultiplier } from 'store/posthog/slice'
import { assertNotUndefined } from 'utils/assertions'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectActiveNetwork } from 'store/network'
import { isDevnet } from 'utils/isDevnet'
import { useGetFeeState } from './useGetFeeState'

const REFETCH_INTERVAL = 3 * 60 * 1000 // 3 minutes

/**
 * A query to recover lost funds if any
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useImportAnyStuckFunds = (
  enabled: boolean,
  handleRecoveryEvent: (events: RecoveryEvents) => void
) => {
  const activeAccount = useSelector(selectActiveAccount)
  const isDevMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const activeNetwork = useSelector(selectActiveNetwork)
  const cBaseFeeMultiplier = useSelector(selectCBaseFeeMultiplier)
  const { defaultFeeState } = useGetFeeState()
  const devnet = isDevnet(activeNetwork)

  return useQuery({
    // no need to retry failed request as we are already doing interval fetching
    retry: false,
    enabled,
    refetchInterval: REFETCH_INTERVAL,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      'ImportAnyStuckFunds',
      activeAccount,
      isDevMode,
      defaultFeeState,
      devnet
    ],
    queryFn: async () => {
      assertNotUndefined(activeAccount)
      await EarnService.importAnyStuckFunds({
        activeAccount,
        isDevMode,
        selectedCurrency,
        progressEvents: handleRecoveryEvent,
        feeState: defaultFeeState,
        isDevnet: devnet,
        cBaseFeeMultiplier
      })
      return true
    }
  })
}
