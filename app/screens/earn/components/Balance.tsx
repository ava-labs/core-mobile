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
import { useWeiAvaxFormatter } from 'hooks/formatter/useWeiAvaxFormatter'
import { useNAvaxFormatter } from 'hooks/formatter/useNAvaxFormatter'
import { BalanceItem } from 'screens/earn/components/BalanceItem'
import { PopableLabel } from 'components/PopableLabel'
import { Row } from 'components/Row'
import { Popable } from 'react-native-popable'
import { useImportAnyStuckFunds } from 'services/earn/useImportAnyStuckFunds'
import { getStakePrimaryColor } from '../utils'
import { BalanceLoader } from './BalanceLoader'
import { CircularProgress } from './CircularProgress'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.StakeDashboard>

export const Balance = () => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const pChainBalance = usePChainBalance()
  const cChainBalance = useCChainBalance()
  const weiAvaxFormatter = useWeiAvaxFormatter()
  const nAvaxFormatter = useNAvaxFormatter()
  const shouldShowLoader = cChainBalance.isLoading || pChainBalance.isLoading

  const [recoveryState, setRecoveryState] = useState(RecoveryEvents.Idle)
  const isFocused = useIsFocused()
  useImportAnyStuckFunds(isFocused, handleRecoveryEvent)

  function handleRecoveryEvent(payload: RecoveryEvents) {
    setRecoveryState(payload)
  }

  if (shouldShowLoader) {
    return <BalanceLoader />
  }

  const shouldShowError =
    cChainBalance.error ||
    !cChainBalance.data ||
    pChainBalance.error ||
    !pChainBalance.data

  if (shouldShowError) return null

  const [availableAvax] = weiAvaxFormatter(cChainBalance.data.balance, true)

  const [claimableAvax] = nAvaxFormatter(
    pChainBalance.data.unlockedUnstaked[0]?.amount,
    true
  )

  const [stakedAvax] = nAvaxFormatter(
    pChainBalance.data.unlockedStaked[0]?.amount,
    true
  )

  const stakingData = [
    {
      type: StakeTypeEnum.Available,
      amount: Number(availableAvax)
    },
    {
      type: StakeTypeEnum.Staked,
      amount: Number(stakedAvax)
    },
    {
      type: StakeTypeEnum.Claimable,
      amount: Number(claimableAvax)
    }
  ]

  const goToGetStarted = () => {
    navigate(AppNavigation.Wallet.Earn, {
      screen: AppNavigation.Earn.StakeSetup,
      params: {
        screen: AppNavigation.StakeSetup.GetStarted
      }
    })
  }

  const goToClaimRewards = () => {
    navigate(AppNavigation.Wallet.Earn, {
      screen: AppNavigation.Earn.ClaimRewards
    })
  }

  const renderStakeButton = () => (
    <AvaButton.PrimaryLarge onPress={goToGetStarted}>
      Stake
    </AvaButton.PrimaryLarge>
  )

  const renderStakeAndClaimButton = () => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}>
      <AvaButton.SecondaryLarge style={{ flex: 1 }} onPress={goToGetStarted}>
        Stake
      </AvaButton.SecondaryLarge>
      <Space x={16} />
      <AvaButton.SecondaryLarge style={{ flex: 1 }} onPress={goToClaimRewards}>
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
              balance={availableAvax}
              poppableItem={
                recoveryState === RecoveryEvents.ImportCStart && (
                  <InaccurateBalancePoppable />
                )
              }
            />
            <BalanceItem
              balanceType={StakeTypeEnum.Staked}
              iconColor={getStakePrimaryColor(StakeTypeEnum.Staked, theme)}
              balance={stakedAvax}
            />
            <BalanceItem
              balanceType={StakeTypeEnum.Claimable}
              iconColor={getStakePrimaryColor(StakeTypeEnum.Claimable, theme)}
              balance={claimableAvax}
              poppableItem={
                recoveryState === RecoveryEvents.ImportPStart && (
                  <InaccurateBalancePoppable />
                )
              }
            />
          </View>
        </Row>
      </View>
      <View>
        {Number(claimableAvax) > 0
          ? renderStakeAndClaimButton()
          : renderStakeButton()}
      </View>
    </View>
  )
}

function InaccurateBalancePoppable() {
  const { theme } = useApplicationContext()

  return (
    <Popable
      content={'Balance may be inaccurate due to network issues'}
      position="top"
      style={{ minWidth: 200 }}
      strictPosition={true}
      backgroundColor={theme.neutral100}>
      <PopableLabel label="" />
    </Popable>
  )
}
