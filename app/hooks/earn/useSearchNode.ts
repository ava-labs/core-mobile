import {
  getFilteredValidators,
  getRandomValidator,
  getSimpleSortedValidators
} from 'services/earn/utils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import Logger from 'utils/Logger'
import { NodeValidator, NodeValidators } from 'types/earn'
import { Avax } from 'types/Avax'

type useSearchNodeProps = {
  stakingAmount: Avax
  stakingEndTime: Date
  validators?: NodeValidators
}

export const useSearchNode = ({
  stakingAmount,
  stakingEndTime,
  validators
}: useSearchNodeProps): { validator?: NodeValidator; error?: Error } => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const noMatchError = new Error(
    `no node matches filter criteria: stakingAmount:  ${stakingAmount}, stakingEndTime: ${stakingEndTime}, minUpTime: 98%`
  )
  const noValidatorsError = new Error(`no validators found.`)

  if (validators && validators.length >= 0) {
    const filteredValidators = getFilteredValidators({
      isDeveloperMode,
      validators,
      stakingAmount,
      stakingEndTime,
      minUpTime: 98
    })
    if (filteredValidators.length === 0) {
      Logger.info(noMatchError.message)
      return { validator: undefined, error: noMatchError }
    }
    const sortedValidators = getSimpleSortedValidators(filteredValidators)
    const matchedValidator = getRandomValidator(sortedValidators)
    return { validator: matchedValidator, error: undefined }
  }
  Logger.info(noValidatorsError.message)
  return { validator: undefined, error: noValidatorsError }
}
