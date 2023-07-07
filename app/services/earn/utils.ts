import Big from 'big.js'

export const MAX_VALIDATOR_WEIGHT_FACTOR = 5

export const calculateMaxWeight = (
  maxValidatorStake: Big,
  stakeAmount: Big
): { maxWeight: Big; maxDelegation: Big } => {
  const stakeWeight = stakeAmount.mul(MAX_VALIDATOR_WEIGHT_FACTOR)
  const maxValidatorStakeBig = new Big(maxValidatorStake.valueOf())
  const maxWeight = stakeWeight.lt(maxValidatorStakeBig)
    ? stakeWeight
    : maxValidatorStakeBig
  const maxDelegation = maxWeight.sub(stakeAmount)

  return {
    maxWeight,
    maxDelegation
  }
}

export const randomColor = () => {
  const hexString = '0123456789abcdef'
  let hexCode = '#'
  for (let i = 0; i < 6; i++) {
    hexCode += hexString[Math.floor(Math.random() * hexString.length)]
  }
  return hexCode
}

export const generateGradient = () => {
  const colorFrom = randomColor()
  const colorTo = randomColor()
  return { colorFrom, colorTo }
}
