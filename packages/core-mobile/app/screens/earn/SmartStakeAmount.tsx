import { useNavigation } from '@react-navigation/native'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import useStakingParams from 'hooks/earn/useStakingParams'
import AppNavigation from 'navigation/AppNavigation'
import { StakeSetupScreenProps } from 'navigation/types'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Spinner from 'components/animation/Spinner'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useEstimateStakingFees } from 'hooks/earn/useEstimateStakingFees'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import NotEnoughAvax from './NotEnoughAvax'
import StakingAmount from './StakingAmount'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.SmartStakeAmount
>

enum BalanceStates {
  UNKNOWN = 'unknown', // we don't have any data yet to determine
  INSUFFICIENT = 'insufficient', // not enough to cover minimum stake amount + fees
  SUFFICIENT = 'sufficient' // // enough to cover minimum stake amount + fees
}

const SmartStakeAmount = (): React.JSX.Element => {
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const { minStakeAmount } = useStakingParams()
  const cChainBalance = useCChainBalance()
  const [balanceState, setBalanceState] = useState(BalanceStates.UNKNOWN)
  const claimableBalance = useGetClaimableBalance()
  const xpProvider = useAvalancheXpProvider()
  const { estimatedStakingFee: networkFees } = useEstimateStakingFees({
    stakingAmount: minStakeAmount,
    xpProvider
  })
  const cChainNetwork = useCChainNetwork()
  const cChainNetworkToken = cChainNetwork?.networkToken

  useEffect(() => {
    if (cChainBalance.data?.balance !== undefined && cChainNetworkToken) {
      const availableAvax = new TokenUnit(
        cChainBalance.data.balance,
        cChainNetworkToken.decimals,
        cChainNetworkToken.symbol
      )
        .add(claimableBalance ?? 0)
        .sub(networkFees ?? 0)
      const notEnoughAvax = availableAvax.lt(minStakeAmount)

      if (notEnoughAvax) {
        setBalanceState(BalanceStates.INSUFFICIENT)
      } else {
        setBalanceState(BalanceStates.SUFFICIENT)
      }
    }
  }, [
    cChainBalance?.data?.balance,
    minStakeAmount,
    claimableBalance,
    networkFees,
    cChainNetworkToken
  ])

  const renderNotEnoughAvax = (): React.JSX.Element => {
    const navToBuy = (): void => {
      navigate(AppNavigation.Wallet.Buy)
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
