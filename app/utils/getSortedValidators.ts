import { random } from 'lodash'
import { Validators, Validator } from './getFilteredValidators'

export const getSimpleSortedValidators = (validators: Validators) => {
  const sorted = validators.sort((a, b): number => {
    return (
      Number(b.uptime) - Number(a.uptime) ||
      Number(b.delegationFee) - Number(a.delegationFee)
    )
  })
  const endIndex = sorted.length >= 5 ? 4 : sorted.length - 1
  const randomIndex = random(0, endIndex)
  const matchedValidator = sorted.at(randomIndex)
  return matchedValidator as Validator
}
