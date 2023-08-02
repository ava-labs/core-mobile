import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { StakeTypeEnum } from 'services/earn/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { Space } from 'components/Space'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useWeiAvaxFormatter } from 'hooks/formatter/useWeiAvaxFormatter'
import { useNAvaxFormatter } from 'hooks/formatter/useNAvaxFormatter'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectPromptForEarnNotifications,
  setPromptForEarnNotifications
} from 'store/notifications'
import { getStakePrimaryColor } from '../utils'
import { CircularProgress } from './CircularProgress'
import { BalanceLoader } from './BalanceLoader'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.StakeDashboard>

export const Balance = () => {
  const dispatch = useDispatch()
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const pChainBalance = usePChainBalance()
  const cChainBalance = useCChainBalance()
  const weiAvaxFormatter = useWeiAvaxFormatter()
  const nAvaxFormatter = useNAvaxFormatter()
  const shouldPromptForEarnNotifications = useSelector(
    selectPromptForEarnNotifications
  )

  if (shouldPromptForEarnNotifications) {
    navigate(AppNavigation.Earn.EarnNotificationsPrompt)
    dispatch(setPromptForEarnNotifications(false))
  }

  const shouldShowLoader = cChainBalance.isLoading || pChainBalance.isLoading

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

  const renderStakingBalance = () => (
    <View style={{ marginHorizontal: 16 }}>
      {stakingData.map((item, index) => {
        const iconColor = getStakePrimaryColor(item.type, theme)
        return (
          <View key={item.type}>
            <View
              style={[styles.rowContainer, { marginTop: index === 0 ? 0 : 8 }]}>
              <View style={[styles.dot, { backgroundColor: iconColor }]} />
              <View style={styles.textRowContainer}>
                <AvaText.Subtitle2
                  textStyle={{
                    color: theme.neutral50,
                    lineHeight: 24.5,
                    marginHorizontal: 8
                  }}>
                  {`${item.amount} AVAX`}
                </AvaText.Subtitle2>
                <AvaText.Caption
                  textStyle={{
                    color: theme.neutral400,
                    lineHeight: 19.92
                  }}>
                  {item.type}
                </AvaText.Caption>
              </View>
            </View>
          </View>
        )
      })}
    </View>
  )

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
    <View style={styles.stakeDetailsContainer}>
      <View style={{ marginBottom: 24 }}>
        <View style={styles.balanceContainer}>
          <CircularProgress data={stakingData} />
          {renderStakingBalance()}
        </View>
      </View>
      <View>
        {Number(claimableAvax) > 0
          ? renderStakeAndClaimButton()
          : renderStakeButton()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stakeDetailsContainer: {
    marginVertical: 24
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  textRowContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8
  }
})
