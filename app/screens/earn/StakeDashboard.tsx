import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { useSelector } from 'react-redux'
import Spinner from 'components/animation/Spinner'
import { selectNetwork } from 'store/network'
import Big from 'big.js'
import useStakingParams from 'hooks/earn/useStakingParams'
import { balanceToDisplayValue } from '@avalabs/utils-sdk'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ChainId } from '@avalabs/chains-sdk'
import { useGetBalance } from 'hooks/earn/useGetBalance'
import { StakeTypeEnum } from 'services/earn/types'
import Logger from 'utils/Logger'
import { round } from 'lodash'
import { Balance } from './components/Balance'
import { StakeTabs } from './StakeTabs'

export const StakeDashboard = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const { isFetching, data, error, fetchStatus } = useGetBalance()

  const { nativeTokenBalance } = useStakingParams()

  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID
  const avaxNetwork = useSelector(selectNetwork(chainId))

  const nativeBalance = useMemo(() => {
    if (avaxNetwork && nativeTokenBalance) {
      return balanceToDisplayValue(
        nativeTokenBalance,
        avaxNetwork.networkToken.decimals
      )
    } else {
      return 0
    }
  }, [avaxNetwork, nativeTokenBalance])

  if (fetchStatus === 'idle')
    // if fetchStatus is idle, the addresses input is empty
    Logger.error('No addresses provided to get P-Chain balance.')

  if (isFetching)
    <View style={styles.spinnerContainer}>
      <Spinner size={77} />
    </View>

  if (error || !data) return null

  const availableAmount = round(Number(nativeBalance), 9)

  const claimableAmount = round(
    Big(data.unlockedUnstaked[0]?.amount || 0)
      .div(Math.pow(10, 9))
      .toNumber(),
    9
  )
  const stakedAmount = round(
    Big(data.lockedStaked[0]?.amount || 0)
      .div(Math.pow(10, 9))
      .toNumber(),
    9
  )

  const stakingData = [
    {
      type: StakeTypeEnum.Available,
      amount: availableAmount
    },
    { type: StakeTypeEnum.Staked, amount: stakedAmount },
    { type: StakeTypeEnum.Claimable, amount: claimableAmount }
  ]

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ paddingHorizontal: 16 }}>
        <AvaText.LargeTitleBold>Stake</AvaText.LargeTitleBold>
      </View>
      <Balance stakingData={stakingData} />
      <View style={{ flex: 1 }}>
        <StakeTabs />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
