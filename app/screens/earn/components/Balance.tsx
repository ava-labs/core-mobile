import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import Big from 'big.js'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { StakeTypeEnum } from 'services/earn/types'
import { round } from 'lodash'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { Space } from 'components/Space'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useWeiAvaxToAvax } from 'hooks/conversion/useWeiAvaxToAvax'
import { getStakePrimaryColor } from '../utils'
import { CircularProgress } from './CircularProgress'
import { BalanceLoader } from './BalanceLoader'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.StakeDashboard>

export const Balance = () => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const pChainBalance = usePChainBalance()
  const cChainBalance = useCChainBalance()
  const weiAvaxToAvax = useWeiAvaxToAvax()

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

  const [availableAvax] = weiAvaxToAvax(
    cChainBalance.data.balance,
    cChainBalance.data.price?.value
  )

  const availableAmount = round(availableAvax, 9)

  const claimableAmount = round(
    Big(pChainBalance.data.unlockedUnstaked[0]?.amount || 0)
      .div(Math.pow(10, 9))
      .toNumber(),
    9
  )
  const stakedAmount = round(
    Big(pChainBalance.data.unlockedStaked[0]?.amount || 0)
      .div(Math.pow(10, 9))
      .toNumber(),
    9
  )

  const stakingData = [
    {
      type: StakeTypeEnum.Available,
      amount: isNaN(availableAmount) ? 0 : availableAmount
    },
    {
      type: StakeTypeEnum.Staked,
      amount: isNaN(stakedAmount) ? 0 : stakedAmount
    },
    {
      type: StakeTypeEnum.Claimable,
      amount: isNaN(claimableAmount) ? 0 : claimableAmount
    }
  ]

  const stakingAmount = stakingData.find(
    item => item.type === 'Claimable'
  )?.amount

  const goToGetStarted = () => {
    navigate(AppNavigation.Wallet.Earn, {
      screen: AppNavigation.Earn.StakeSetup,
      params: {
        screen: AppNavigation.StakeSetup.GetStarted
      }
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
                  {`${isNaN(item.amount) ? 0 : item.amount} AVAX`}
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
      <AvaButton.SecondaryLarge
        style={{ flex: 1 }}
        onPress={() => {
          // to be implemented
        }}>
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
        {stakingAmount && stakingAmount > 0
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
