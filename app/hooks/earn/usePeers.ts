import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const usePeers = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: ['peers', isDeveloperMode],
    queryFn: async () => {
      return await EarnService.getPeers(isDeveloperMode)
    }
  })
}
