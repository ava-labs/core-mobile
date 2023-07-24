import { useNavigation } from '@react-navigation/native'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import useStakingParams from 'hooks/earn/useStakingParams'
import AppNavigation from 'navigation/AppNavigation'
import { StakeSetupScreenProps } from 'navigation/types'
import React, { useEffect, useState } from 'react'
import { BigIntWeiAvax } from 'types/denominations'
import { StyleSheet, View } from 'react-native'
import Spinner from 'components/animation/Spinner'
import NotEnoughAvax from './NotEnoughAvax'
import StakingAmount from './StakingAmount'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.SmartStakeAmount
>

enum BalanceStates {
  UNKNOWN = 'unknown', // we don't have any data yet to determine
  INSUFFICIENT = 'INSUFFICIENT', // not enough to cover minimum stake amount + fees
  SUFFICIENT = 'SUFFICIENT' // // enough to cover minimum stake amount + fees
}

const SmartStakeAmount = () => {
  const { navigate, getParent } = useNavigation<ScreenProps['navigation']>()
  const { minStakeAmount } = useStakingParams()
  const cChainBalance = useCChainBalance()
  const [balanceState, setBalanceState] = useState(BalanceStates.UNKNOWN)

  useEffect(() => {
    if (cChainBalance.data?.balance) {
      const availableAvax = BigInt(cChainBalance.data.balance) as BigIntWeiAvax
      const notEnoughAvax = availableAvax < minStakeAmount

      if (notEnoughAvax) {
        setBalanceState(BalanceStates.INSUFFICIENT)
      } else {
        setBalanceState(BalanceStates.SUFFICIENT)
      }
    }
  }, [cChainBalance?.data?.balance, minStakeAmount])

  const renderNotEnoughAvax = () => {
    const navToBuy = () => {
      getParent()?.goBack()
      navigate(AppNavigation.Wallet.Buy)
    }
    const navToReceive = () => {
      getParent()?.goBack()
      navigate(AppNavigation.Wallet.ReceiveTokens)
    }
    const navToSwap = () => {
      getParent()?.goBack()
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
