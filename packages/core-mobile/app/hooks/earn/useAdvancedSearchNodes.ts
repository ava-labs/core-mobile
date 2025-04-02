import { useSelector } from 'react-redux'
import {
  getAdvancedSortedValidators,
  getFilteredValidators,
  getSortedValidatorsByEndTime,
  isEndTimeOverOneYear as isOverOneYear
} from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { AdvancedSortFilter, NodeValidators } from 'types/earn'
import Logger from 'utils/Logger'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { usePeers } from './usePeers'

export type useAdvancedSearchNodesProps = {
  stakingAmount: TokenUnit
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
}: useAdvancedSearchNodesProps):
  | {
      validators: NodeValidators | undefined
      error: undefined
    }
  | {
      validators: never[]
      error: Error
    } => {
  const { data: peers } = usePeers()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isEndTimeOverOneYear = isOverOneYear(stakingEndTime)
  const noMatchError = new Error(
    `no node matches filter criteria: stakingAmount:  ${stakingAmount}, stakingEndTime: ${stakingEndTime}, minUpTime: ${minUpTime}`
  )
  const noValidatorsError = new Error(`no validators found.`)

  if (validators && validators.length > 0) {
    const filteredValidators = getFilteredValidators({
      isDeveloperMode,
      validators,
      stakingAmount,
      stakingEndTime,
      minUpTime,
      maxFee,
      searchText,
      isEndTimeOverOneYear
    })
    if (filteredValidators.length === 0) {
      Logger.info(noMatchError.message)
      return { validators: [], error: noMatchError }
    }

    // show only the top 5 validators with longest staking end time
    let matchedValidators = filteredValidators
    if (isEndTimeOverOneYear) {
      const sorted = getSortedValidatorsByEndTime(filteredValidators)
      matchedValidators = sorted.slice(0, 5)
    }

    const sortedValidators = getAdvancedSortedValidators(
      matchedValidators,
      sortFilter ?? AdvancedSortFilter.UpTimeHighToLow,
      peers
    )
    return { validators: sortedValidators ?? [], error: undefined }
  }
  Logger.info(noValidatorsError.message)
  return { validators: [], error: noValidatorsError }
}
