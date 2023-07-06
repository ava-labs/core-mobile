import { useQuery } from '@tanstack/react-query'
import BN from 'bn.js'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getFilteredValidators } from 'utils/getFilteredValidators'

export const useNodes = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: [
      'nodes',
      isDeveloperMode,
      stakingDuration,
      stakingAmount,
      minUpTime
    ],
    queryFn: async () => {
      const result = await EarnService.getCurrentValidators(isDeveloperMode)
      const filteredValidators = getFilteredValidators(
        result.validators,
        stakingAmount,
        isDeveloperMode,
        stakingDuration,
        minUpTime
      )
      return filteredValidators
    }
  })
}
