import AvaButton from 'components/AvaButton'
import React from 'react'
import { StyleSheet } from 'react-native'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { getZeroAvaxPChain } from 'utils/units/zeroValues'

const PercentButtons = ({
  balance,
  onPercentageSelected,
  isDeveloperMode
}: {
  balance: TokenUnit | undefined
  onPercentageSelected: (factor: number) => void
  isDeveloperMode: boolean
}): JSX.Element => {
  const minStakeAmount = isDeveloperMode
    ? getZeroAvaxPChain().add(1)
    : getZeroAvaxPChain().add(25)
  const canStake10Percent = balance && balance.gt(minStakeAmount.mul(10))
  const canStake25Percent = balance && balance.gt(minStakeAmount.mul(4))
  const canStake50Percent = balance && balance.gt(minStakeAmount.mul(2))
  const canStake100Percent = balance && balance.gt(minStakeAmount)
  return (
    <>
      {canStake10Percent && (
        <AvaButton.SecondaryLarge
          style={styles.button}
          onPress={() => onPercentageSelected(10)}>
          10%
        </AvaButton.SecondaryLarge>
      )}
      {canStake25Percent && (
        <AvaButton.SecondaryLarge
          style={styles.button}
          onPress={() => onPercentageSelected(4)}>
          25%
        </AvaButton.SecondaryLarge>
      )}
      {canStake50Percent && (
        <AvaButton.SecondaryLarge
          style={styles.button}
          onPress={() => onPercentageSelected(2)}>
          50%
        </AvaButton.SecondaryLarge>
      )}
      {canStake100Percent && (
        <AvaButton.SecondaryLarge
          style={styles.button}
          onPress={() => onPercentageSelected(1)}>
          Max
        </AvaButton.SecondaryLarge>
      )}
    </>
  )
}
const styles = StyleSheet.create({
  button: {
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 0
  }
})
export default PercentButtons
