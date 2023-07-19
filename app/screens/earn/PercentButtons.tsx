import AvaButton from 'components/AvaButton'
import React from 'react'
import { StyleSheet } from 'react-native'
import { BigIntNAvax, BigIntWeiAvax } from 'types/denominations'

const PercentButtons = ({
  balance,
  onPercentageSelected,
  isDeveloperMode
}: {
  balance: BigIntWeiAvax | undefined
  onPercentageSelected: (factor: number) => void
  isDeveloperMode: boolean
}) => {
  const minStakeAmount: BigIntNAvax = BigInt(isDeveloperMode ? 1e9 : 25e9)
  const p10 = minStakeAmount * 10n
  const p25 = minStakeAmount * 4n
  const p50 = minStakeAmount * 2n
  const p100 = minStakeAmount

  return (
    <>
      {balance && balance > p10 && (
        <AvaButton.SecondaryLarge
          style={styles.button}
          onPress={() => onPercentageSelected(10)}>
          10%
        </AvaButton.SecondaryLarge>
      )}
      {balance && balance > p25 && (
        <AvaButton.SecondaryLarge
          style={styles.button}
          onPress={() => onPercentageSelected(4)}>
          25%
        </AvaButton.SecondaryLarge>
      )}
      {balance && balance > p50 && (
        <AvaButton.SecondaryLarge
          style={styles.button}
          onPress={() => onPercentageSelected(2)}>
          50%
        </AvaButton.SecondaryLarge>
      )}
      {balance && balance > p100 && (
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
