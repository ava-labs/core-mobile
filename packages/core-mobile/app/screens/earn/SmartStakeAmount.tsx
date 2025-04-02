import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { StakeSetupScreenProps } from 'navigation/types'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Spinner from 'components/animation/Spinner'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import NotEnoughAvax from './NotEnoughAvax'
import StakingAmount from './StakingAmount'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.SmartStakeAmount
>

enum BalanceStates {
  UNKNOWN = 'unknown', // we don't have any data yet to determine
  INSUFFICIENT = 'insufficient', // not enough to cover minimum stake amount
  SUFFICIENT = 'sufficient' // // enough to cover minimum stake amount
}

const SmartStakeAmount = (): React.JSX.Element => {
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()
  const [balanceState, setBalanceState] = useState(BalanceStates.UNKNOWN)

  useEffect(() => {
    if (hasEnoughAvax === undefined) return

    if (hasEnoughAvax) {
      setBalanceState(BalanceStates.SUFFICIENT)
    } else {
      setBalanceState(BalanceStates.INSUFFICIENT)
    }
  }, [hasEnoughAvax])

  const renderNotEnoughAvax = (): React.JSX.Element => {
    const navToBuy = (): void => {
      navigate(AppNavigation.Wallet.Buy, {
        screen: AppNavigation.Buy.Buy,
        params: { showAvaxWarning: true }
      })
    }
    const navToReceive = (): void => {
      navigate(AppNavigation.Wallet.ReceiveTokens)
    }
    const navToSwap = (): void => {
      navigate(AppNavigation.Wallet.Swap)
    }

    return (
      <NotEnoughAvax
        onBuyAvax={navToBuy}
        onReceive={navToReceive}
        onSwap={navToSwap}
      />
    )
  }

  if (balanceState === BalanceStates.UNKNOWN)
    return (
      <View style={styles.spinnerContainer}>
        <Spinner size={77} />
      </View>
    )

  if (balanceState === BalanceStates.INSUFFICIENT) return renderNotEnoughAvax()

  return <StakingAmount />
}

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default SmartStakeAmount
