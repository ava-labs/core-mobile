import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import EarnService from 'services/earn/EarnService'
import { selectActiveAccount } from 'store/account'
import { RecoveryEvents } from 'services/earn/types'
import { assertNotUndefined } from 'utils/assertions'

const REFETCH_INTERVAL = 2 * 60 * 1000 // 2 minutes

/**
 * A query to recover lost funds if any
 */
export const useImportAnyStuckFunds = (
  enabled: boolean,
  handleRecoveryEvent: (events: RecoveryEvents) => void
) => {
  const activeAccount = useSelector(selectActiveAccount)
  const isDevMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    // no need to retry failed request as we are already doing interval fetching
    retry: false,
    enabled,
    refetchInterval: REFETCH_INTERVAL,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['ImportAnyStuckFunds', activeAccount, isDevMode],
    queryFn: async () => {
      assertNotUndefined(activeAccount)
      await EarnService.importAnyStuckFunds({
        activeAccount,
        isDevMode,
        progressEvents: handleRecoveryEvent
      })
      return true
    }
  })
}
