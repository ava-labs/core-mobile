import {
  getFilteredValidators,
  getRandomValidator,
  getSimpleSortedValidators,
  isEndTimeOverOneYear as isOverOneYear
} from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import Logger from 'utils/Logger'
import { NodeValidator, NodeValidators } from 'types/earn'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { usePeers } from './usePeers'

type useSearchNodeProps = {
  stakingAmount: TokenUnit
  stakingEndTime: Date
  validators?: NodeValidators
}

export const useSearchNode = ({
  stakingAmount,
  stakingEndTime,
  validators
}: useSearchNodeProps): { validator?: NodeValidator; error?: Error } => {
  const { data: peers } = usePeers()

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isEndTimeOverOneYear = isOverOneYear(stakingEndTime)
  const noMatchError = new Error(
    `no node matches filter criteria: stakingAmount:  ${stakingAmount.toDisplay()}, stakingEndTime: ${stakingEndTime}, minUpTime: 98%`
  )
  const noValidatorsError = new Error(`no validators found.`)

  if (validators && validators.length > 0) {
    const filteredValidators = getFilteredValidators({
      isDeveloperMode,
      validators,
      stakingAmount,
      stakingEndTime,
      minUpTime: 98,
      maxFee: 4,
      isEndTimeOverOneYear
    })

    if (filteredValidators.length === 0) {
      Logger.info(noMatchError.message)
      return { validator: undefined, error: noMatchError }
    }
    const sortedValidators = getSimpleSortedValidators(
      filteredValidators,
      peers,
      isEndTimeOverOneYear
    )
    const matchedValidator = getRandomValidator(
      sortedValidators,
      isEndTimeOverOneYear
    )
    return { validator: matchedValidator, error: undefined }
  }
  Logger.info(noValidatorsError.message)
  return { validator: undefined, error: noValidatorsError }
}
