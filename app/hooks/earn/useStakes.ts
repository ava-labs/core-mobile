import { useQuery } from '@tanstack/react-query'
import { refetchIntervals } from 'consts/earn'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useStakes = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const account = useSelector(selectActiveAccount)
  const pAddress = account?.addressPVM ?? ''

  return useQuery({
    refetchInterval: refetchIntervals.stakes,
    enabled: Boolean(pAddress),
    queryKey: ['stakes', isDeveloperMode, pAddress],
    queryFn: () =>
      EarnService.getAllStakes({
        isTestnet: isDeveloperMode,
        addresses: [pAddress]
      })
  })
}
