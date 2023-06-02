import { stringToBN } from '@avalabs/utils-sdk'
import BN from 'bn.js'
import AvaButton from 'components/AvaButton'
import React from 'react'
import { StyleSheet } from 'react-native'

const PercentButtons = ({
  balance,
  onPercentageSelected,
  isDeveloperMode
}: {
  balance: BN | undefined
  onPercentageSelected: (factor: number) => void
  isDeveloperMode: boolean
}) => {
  const AVAX_DECIMAL = 18
  const minStakeAmount = stringToBN(isDeveloperMode ? '1' : '25', AVAX_DECIMAL)
  const p10 = minStakeAmount.mul(new BN(10))
  const p25 = minStakeAmount.mul(new BN(4))
  const p50 = minStakeAmount.mul(new BN(2))
  const p100 = minStakeAmount

  return (
    <>
      {balance?.gt(p10) && (
        <AvaButton.SecondaryLarge
          style={styles.button}
          onPress={() => onPercentageSelected(10)}>
          10%
        </AvaButton.SecondaryLarge>
      )}
      {balance?.gt(p25) && (
        <AvaButton.SecondaryLarge
          style={styles.button}
          onPress={() => onPercentageSelected(4)}>
          25%
        </AvaButton.SecondaryLarge>
      )}
      {balance?.gt(p50) && (
        <AvaButton.SecondaryLarge
          style={styles.button}
          onPress={() => onPercentageSelected(2)}>
          50%
        </AvaButton.SecondaryLarge>
      )}
      {balance?.gt(p100) && (
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
