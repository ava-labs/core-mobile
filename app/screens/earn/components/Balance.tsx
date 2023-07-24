import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { useSelector } from 'react-redux'
import { selectNetwork } from 'store/network'
import Big from 'big.js'
import useStakingParams from 'hooks/earn/useStakingParams'
import { balanceToDisplayValue } from '@avalabs/utils-sdk'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ChainId } from '@avalabs/chains-sdk'
import { useGetPChainBalance } from 'hooks/earn/useGetPChainBalance'
import { StakeTypeEnum } from 'services/earn/types'
import { round } from 'lodash'
import { BN } from 'bn.js'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { Space } from 'components/Space'
import { selectIsLoadingBalances } from 'store/balance'
import { getStakePrimaryColor } from '../utils'
import { CircularProgress } from './CircularProgress'
import { BalanceLoader } from './BalanceLoader'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.StakeDashboard>

export const Balance = () => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { isLoading: isLoadingPBalances, data, error } = useGetPChainBalance()
  const { nativeTokenBalance } = useStakingParams()
  const isLoadingCBalance = useSelector(selectIsLoadingBalances)

  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID
  const avaxNetwork = useSelector(selectNetwork(chainId))

  const nativeBalance = useMemo(() => {
    if (avaxNetwork && nativeTokenBalance) {
      return balanceToDisplayValue(
        new BN(nativeTokenBalance.toString()),
        avaxNetwork.networkToken.decimals
      )
    } else {
      return 0
    }
  }, [avaxNetwork, nativeTokenBalance])

  const shouldShowLoader = isLoadingCBalance || isLoadingPBalances

  if (shouldShowLoader) {
    return <BalanceLoader />
  }

  if (error || !data) return null

  const availableAmount = round(Number(nativeBalance), 9)

  const claimableAmount = round(
    Big(data.unlockedUnstaked[0]?.amount || 0)
      .div(Math.pow(10, 9))
      .toNumber(),
    9
  )
  const stakedAmount = round(
    Big(data.unlockedStaked[0]?.amount || 0)
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
