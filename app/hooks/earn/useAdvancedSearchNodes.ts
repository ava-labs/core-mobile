import { useSelector } from 'react-redux'
import {
  getAdvancedSortedValidators,
  getFilteredValidators
} from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { AdvancedSortFilter, NodeValidators } from 'types/earn'
import Logger from 'utils/Logger'
import { Avax } from 'types/Avax'

export type useAdvancedSearchNodesProps = {
  stakingAmount: Avax
  stakingEndTime: Date
  minUpTime?: number
  maxFee?: number
  validators?: NodeValidators
  sortFilter?: AdvancedSortFilter
  searchText?: string
}

/**
 *
 * @param stakingAmount filter by staking amount
 * @param stakingEndTime filter by staking end time
 * @param minUpTime filter by minimum up time
 * @param maxFee filter by max delegation fee
 * @param validators list of validators to filter from
 * @param sortFilter sort by upTime, delegation fee, or duration
 * @param searchText search by nodeID
 * @returns filtered & sorted validators and error
 */
export const useAdvancedSearchNodes = ({
  stakingAmount,
  stakingEndTime,
  minUpTime,
  maxFee,
  validators,
  sortFilter,
  searchText
}: useAdvancedSearchNodesProps) => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const noMatchError = new Error(
    `no node matches filter criteria: stakingAmount:  ${stakingAmount}, stakingEndTime: ${stakingEndTime}, minUpTime: ${minUpTime}`
  )
  const noValidatorsError = new Error(`no validators found.`)

  if (validators && validators.length >= 0) {
    const filteredValidators = getFilteredValidators({
      isDeveloperMode,
      validators,
      stakingAmount,
      stakingEndTime,
      minUpTime,
      maxFee,
      searchText
    })
    if (filteredValidators.length === 0) {
      Logger.info(noMatchError.message)
      return { validators: [], error: noMatchError }
    }
    const sortedValidators = getAdvancedSortedValidators(
      filteredValidators,
      sortFilter ?? AdvancedSortFilter.UpTimeHighToLow
    )
    return { validators: sortedValidators, error: undefined }
  }
  Logger.info(noValidatorsError.message)
  return { validators: [], error: noValidatorsError }
}
