import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getPvmApi } from 'utils/network/pvm'

// TODO: add filtering logic
export const useNodes = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: ['nodes', isDeveloperMode],
    queryFn: async () => {
      return getPvmApi(isDeveloperMode).getCurrentValidators()
    }
  })
}
