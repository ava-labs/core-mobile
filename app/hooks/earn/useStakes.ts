import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const POLLING_INTERVAL = 30000 // 30 seconds

export const useStakes = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const account = useSelector(selectActiveAccount)
  const pAddress = account?.addressPVM ?? ''

  return useQuery({
    refetchInterval: POLLING_INTERVAL,
    enabled: Boolean(pAddress),
    queryKey: ['stakes', isDeveloperMode, pAddress],
    queryFn: () =>
      EarnService.getAllStakes({
        isTestnet: isDeveloperMode,
        addresses: [pAddress]
      })
  })
}
