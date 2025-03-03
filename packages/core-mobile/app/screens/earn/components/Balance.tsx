import React, { useState, useMemo } from 'react'
import { View } from 'react-native'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { RecoveryEvents, StakeTypeEnum } from 'services/earn/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { Space } from 'components/Space'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { BalanceItem } from 'screens/earn/components/BalanceItem'
import { Row } from 'components/Row'
import { useImportAnyStuckFunds } from 'hooks/earn/useImportAnyStuckFunds'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import NetworkService from 'services/network/NetworkService'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { getStakePrimaryColor } from '../utils'
import { BalanceLoader } from './BalanceLoader'
import { CircularProgress } from './CircularProgress'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.StakeDashboard>

export const Balance = (): JSX.Element | null => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const pChainBalance = usePChainBalance()
  const cChainBalance = useCChainBalance()
  const shouldShowLoader = cChainBalance.isLoading || pChainBalance.isLoading
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const cChainNetwork = useCChainNetwork()
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDeveloperMode)

  const [recoveryState, setRecoveryState] = useState(RecoveryEvents.Idle)
  const isFocused = useIsFocused()
  useImportAnyStuckFunds(isFocused, setRecoveryState)

  const availableInAvax = useMemo(() => {
    return cChainBalance.data?.balance !== undefined && cChainNetwork
      ? new TokenUnit(
          cChainBalance.data.balance,
          cChainNetwork.networkToken.decimals,
          cChainNetwork.networkToken.symbol
        )
      : undefined
  }, [cChainBalance.data?.balance, cChainNetwork])

  const claimableInAvax = useMemo(() => {
    const unlockedUnStakedInNAvax =
      pChainBalance.data?.balancePerType.unlockedUnstaked

    return unlockedUnStakedInNAvax !== undefined
      ? new TokenUnit(
          unlockedUnStakedInNAvax,
          pChainNetworkToken.decimals,
          pChainNetworkToken.symbol
        )
      : undefined
  }, [
    pChainBalance.data?.balancePerType.unlockedUnstaked,
    pChainNetworkToken.decimals,
    pChainNetworkToken.symbol
  ])

  const stakedInAvax = useMemo(() => {
    const unlockedStakedInNAvax =
      pChainBalance.data?.balancePerType.unlockedStaked
    return unlockedStakedInNAvax !== undefined
      ? new TokenUnit(
          unlockedStakedInNAvax,
          pChainNetworkToken.decimals,
          pChainNetworkToken.symbol
        )
      : undefined
  }, [
    pChainBalance.data?.balancePerType.unlockedStaked,
    pChainNetworkToken.decimals,
    pChainNetworkToken.symbol
  ])

  const pendingStakedInAvax = useMemo(() => {
    const pendingStakedInNAvax =
      pChainBalance.data?.balancePerType.pendingStaked
    return pendingStakedInNAvax !== undefined
      ? new TokenUnit(
          pendingStakedInNAvax,
          pChainNetworkToken.decimals,
          pChainNetworkToken.symbol
        )
      : undefined
  }, [
    pChainBalance.data?.balancePerType.pendingStaked,
    pChainNetworkToken.decimals,
    pChainNetworkToken.symbol
  ])

  const totalStakedInAvax = useMemo(() => {
    if (pendingStakedInAvax === undefined) {
      return stakedInAvax
    }

    if (stakedInAvax === undefined) {
      return pendingStakedInAvax
    }

    return stakedInAvax.add(pendingStakedInAvax)
  }, [stakedInAvax, pendingStakedInAvax])

  const goToGetStarted = (): void => {
    AnalyticsService.capture('StakeBegin', { from: 'BalanceScreen' })
    navigate(AppNavigation.Wallet.Earn, {
      screen: AppNavigation.Earn.StakeSetup,
      params: {
        screen: AppNavigation.StakeSetup.GetStarted
      }
    })
  }

  const goToClaimRewards = (): void => {
    AnalyticsService.capture('StakeClaim')
    navigate(AppNavigation.Wallet.Earn, {
      screen: AppNavigation.Earn.ClaimRewards
    })
  }

  const renderStakeButton = (): JSX.Element => (
    <AvaButton.PrimaryLarge testID="stake_btn" onPress={goToGetStarted}>
      Stake
    </AvaButton.PrimaryLarge>
  )

  if (shouldShowLoader) {
    return <BalanceLoader />
  }

  const shouldShowError =
    cChainBalance.error ||
    !cChainBalance.data ||
    pChainBalance.error ||
    !pChainBalance.data

  if (shouldShowError) return null

  const stakingData = [
    {
      type: StakeTypeEnum.Available,
      amount: availableInAvax?.toDisplay({ asNumber: true })
    },
    {
      type: StakeTypeEnum.Staked,
      amount: totalStakedInAvax?.toDisplay({ asNumber: true })
    },
    {
      type: StakeTypeEnum.Claimable,
      amount: claimableInAvax?.toDisplay({ asNumber: true })
    }
  ]

  const renderStakeAndClaimButton = (): JSX.Element => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}>
      <AvaButton.SecondaryLarge
        testID="stake_btn_secondary"
        style={{ flex: 1 }}
        onPress={goToGetStarted}>
        Stake
      </AvaButton.SecondaryLarge>
      <Space x={16} />
      <AvaButton.SecondaryLarge
        testID="stake_claim_btn"
        style={{ flex: 1 }}
        onPress={goToClaimRewards}>
        Claim
      </AvaButton.SecondaryLarge>
    </View>
  )

  return (
    <View style={{ marginVertical: 24 }}>
      <View style={{ marginBottom: 24 }}>
        <Row style={{ marginHorizontal: 24 }}>
          <CircularProgress data={stakingData} />
          <View
            style={{
              marginStart: 24,
              justifyContent: 'space-between',
              marginVertical: 4
            }}>
            <BalanceItem
              balanceType={StakeTypeEnum.Available}
              iconColor={getStakePrimaryColor(StakeTypeEnum.Available, theme)}
              balance={
                availableInAvax?.toDisplay({ fixedDp: 4 }) ?? UNKNOWN_AMOUNT
              }
              poppableItem={
                [
                  RecoveryEvents.ImportCStart,
                  RecoveryEvents.GetAtomicUTXOsFailIng
                ].includes(recoveryState) && <InaccurateBalancePoppable />
              }
            />
            <BalanceItem
              balanceType={StakeTypeEnum.Staked}
              iconColor={getStakePrimaryColor(StakeTypeEnum.Staked, theme)}
              balance={
                totalStakedInAvax?.toDisplay({ fixedDp: 4 }) ?? UNKNOWN_AMOUNT
              }
            />
            <BalanceItem
              testID="claimable_balance"
              balanceType={StakeTypeEnum.Claimable}
              iconColor={getStakePrimaryColor(StakeTypeEnum.Claimable, theme)}
              balance={
                claimableInAvax?.toDisplay({ fixedDp: 4 }) ?? UNKNOWN_AMOUNT
              }
              poppableItem={
                [
                  RecoveryEvents.ImportPStart,
                  RecoveryEvents.GetAtomicUTXOsFailIng
                ].includes(recoveryState) && <InaccurateBalancePoppable />
              }
            />
          </View>
        </Row>
      </View>
      <View>
        {claimableInAvax?.gt(0.05)
          ? renderStakeAndClaimButton()
          : renderStakeButton()}
      </View>
    </View>
  )
}

function InaccurateBalancePoppable(): JSX.Element {
  return (
    <Tooltip
      caretPosition="right"
      caretStyle={{ margin: 5 }}
      content="Balance may be inaccurate due to network issues"
      style={{ width: 200 }}>
      {''}
    </Tooltip>
  )
}
