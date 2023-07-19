import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { StakingBalanceType } from 'services/earn/types'
import { Space } from 'components/Space'
import { getStakePrimaryColor } from '../utils'
import { CircularProgress } from './CircularProgress'

interface BalanceProps {
  stakingData: StakingBalanceType[]
}

type EarnScreenNavProps = EarnScreenProps<
  typeof AppNavigation.Earn.StakeDashboard
>

export const Balance: React.FC<BalanceProps> = ({ stakingData }) => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<EarnScreenNavProps['navigation']>()

  const stakingAmount = stakingData.find(
    data => data.type === 'Claimable'
  )?.amount

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
    <AvaButton.PrimaryLarge
      onPress={() =>
        navigate(AppNavigation.Earn.StakeSetup, {
          screen: AppNavigation.StakeSetup.StakingAmount
        })
      }>
      Stake
    </AvaButton.PrimaryLarge>
  )

  const renderStakeAndClaimButton = () => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}>
      <AvaButton.SecondaryLarge
        style={{ flex: 1 }}
        onPress={() =>
          navigate(AppNavigation.Earn.StakeSetup, {
            screen: AppNavigation.StakeSetup.StakingAmount
          })
        }>
        Stake
      </AvaButton.SecondaryLarge>
      <Space x={16} />
      <AvaButton.SecondaryLarge
        style={{ flex: 1 }}
        onPress={() =>
          navigate(AppNavigation.Earn.StakeSetup, {
            screen: AppNavigation.StakeSetup.StakingAmount
          })
        }>
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
