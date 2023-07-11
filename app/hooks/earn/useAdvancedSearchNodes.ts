import BN from 'bn.js'
import { useSelector } from 'react-redux'
import {
  getAdvancedSortedValidators,
  getFilteredValidators
} from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { AdvancedSortFilter, NodeValidators } from 'types/earn.types'
import Logger from 'utils/Logger'

export type useAdvancedSearchNodesProps = {
  stakingAmount: BN
  stakingEndTime: Date
  minUpTime?: number
  maxFee?: number
  validators?: NodeValidators
  sortFilter?: AdvancedSortFilter
  searchText?: string
}

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
    `no node matches filter criteria: stakingAmount:  ${stakingAmount}, stakingEndTime: ${stakingEndTime}, minUpTime: 98%`
  )

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
  Logger.info(noMatchError.message)
  return { validators: [], error: noMatchError }
}
