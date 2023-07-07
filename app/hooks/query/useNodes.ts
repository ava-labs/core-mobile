import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useNodes = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: ['nodes', isDeveloperMode],
    queryFn: async () => {
      return EarnService.getCurrentValidators(isDeveloperMode)
    }
  })
}
