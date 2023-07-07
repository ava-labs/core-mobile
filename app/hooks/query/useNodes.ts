import { useQuery } from '@tanstack/react-query'
import BN from 'bn.js'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getFilteredValidators } from 'utils/getFilteredValidators'

export type UseNodesProps = {
  stakingEndTime: Date
  stakingAmount: BN
  minUpTime: number
}

/**
 *
 * @param stakingAmount nAVAX with denomination 18
 * @param stakingEndTime
 * @param minUpTime
 * @returns list of node validators
 */
export const useNodes = ({
  stakingAmount,
  stakingEndTime,
  minUpTime = 0
}: UseNodesProps) => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: [
      'nodes',
      isDeveloperMode,
      stakingEndTime,
      stakingAmount,
      minUpTime
    ],
    queryFn: async () => {
      const result = await EarnService.getCurrentValidators(isDeveloperMode)
      const filteredValidators = getFilteredValidators(
        result.validators,
        stakingAmount,
        isDeveloperMode,
        stakingEndTime,
        minUpTime
      )
      return filteredValidators
    }
  })
}
