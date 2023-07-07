import { random } from 'lodash'
import { NodeValidator, NodeValidators } from 'screens/earn/SelectNode'

/**
 *
 * @param validators input to sort by staking uptime and delegation fee,
 * @returns sorted validators
 */
export const getSimpleSortedValidators = (validators: NodeValidators) => {
  return validators.sort((a, b): number => {
    return (
      Number(b.uptime) - Number(a.uptime) ||
      Number(b.delegationFee) - Number(a.delegationFee)
    )
  })
}

/**
 *
 * @param validators input to take random item from,
 * @returns random item from either top 5 items in the array or all of the items in the array
 */
export const getRandomValidator = (validators: NodeValidators) => {
  const endIndex = validators.length >= 5 ? 4 : validators.length - 1
  const randomIndex = random(0, endIndex)
  const matchedValidator = validators.at(randomIndex)
  return matchedValidator as NodeValidator
}
