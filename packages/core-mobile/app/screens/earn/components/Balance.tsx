import React, { useState } from 'react'
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

  if (shouldShowLoader) {
    return <BalanceLoader />
  }

  const shouldShowError =
    cChainBalance.error ||
    !cChainBalance.data ||
    pChainBalance.error ||
    !pChainBalance.data

  if (shouldShowError) return null

  const availableInAvax =
    cChainBalance.data?.balance && cChainNetwork
      ? new TokenUnit(
          cChainBalance.data.balance,
          cChainNetwork.networkToken.decimals,
          cChainNetwork.networkToken.symbol
        )
      : undefined

  const unlockedUnStakedInNAvax =
    pChainBalance.data?.balancePerType.unlockedUnstaked
  const claimableInAvax = unlockedUnStakedInNAvax
    ? new TokenUnit(
        unlockedUnStakedInNAvax,
        pChainNetworkToken.decimals,
        pChainNetworkToken.symbol
      )
    : undefined

  const unlockedStakedInNAvax =
    pChainBalance.data?.balancePerType.unlockedStaked
  const stakedInAvax = unlockedStakedInNAvax
    ? new TokenUnit(
        unlockedStakedInNAvax,
        pChainNetworkToken.decimals,
        pChainNetworkToken.symbol
      )
    : undefined

  const pendingStakedInNAvax = pChainBalance.data?.balancePerType.pendingStaked
  const pendingStakedInAvax = pendingStakedInNAvax
    ? new TokenUnit(
        pendingStakedInNAvax,
        pChainNetworkToken.decimals,
        pChainNetworkToken.symbol
      )
    : undefined

  const totalStakedInAvax = pendingStakedInAvax
    ? stakedInAvax?.add(pendingStakedInAvax)
    : undefined

  const stakingData = [
    {
      type: StakeTypeEnum.Available,
      amount: availableInAvax?.toDisplay({ asNumber: true }) ?? 0
    },
    {
      type: StakeTypeEnum.Staked,
      amount: totalStakedInAvax?.toDisplay({ asNumber: true }) ?? 0
    },
    {
      type: StakeTypeEnum.Claimable,
      amount: claimableInAvax?.toDisplay({ asNumber: true }) ?? 0
    }
  ]

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
              balance={availableInAvax?.toDisplay() ?? '-'}
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
              balance={totalStakedInAvax?.toDisplay() ?? '-'}
            />
            <BalanceItem
              balanceType={StakeTypeEnum.Claimable}
              iconColor={getStakePrimaryColor(StakeTypeEnum.Claimable, theme)}
              balance={claimableInAvax?.toDisplay() ?? '-'}
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
        {claimableInAvax?.gt(0)
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
