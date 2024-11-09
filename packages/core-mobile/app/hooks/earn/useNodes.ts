import { pvm } from '@avalabs/avalanchejs'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectActiveNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isDevnet } from 'utils/isDevnet'

export const useNodes = (): UseQueryResult<
  pvm.GetCurrentValidatorsResponse,
  Error
> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeNetwork = useSelector(selectActiveNetwork)
  return useQuery({
    queryKey: ['nodes', isDeveloperMode, activeNetwork],

    queryFn: () =>
      EarnService.getCurrentValidators(isDeveloperMode, isDevnet(activeNetwork))
  })
}
