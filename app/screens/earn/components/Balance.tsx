import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import DotSVG from 'components/svg/DotSVG'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { StakingBalanceType } from 'services/earn/types'
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

  const renderStakingBalance = () => (
    <View style={{ marginLeft: 24 }}>
      {stakingData.map(item => {
        const iconColor = getStakePrimaryColor(item.type, theme)
        return (
          <View key={item.type}>
            <View style={styles.rowContainer}>
              <DotSVG fillColor={iconColor} size={16} />
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

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.stakeDetailsContainer}>
        <CircularProgress data={stakingData} />
        {renderStakingBalance()}
      </View>
      <AvaButton.PrimaryLarge
        onPress={() => navigate(AppNavigation.Earn.StakingAmount)}>
        Stake More
      </AvaButton.PrimaryLarge>
    </View>
  )
}

const styles = StyleSheet.create({
  stakeDetailsContainer: {
    flexDirection: 'row',
    marginVertical: 24,
    marginHorizontal: 40
  },
  rowContainer: { flexDirection: 'row', alignItems: 'center' },
  textRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4
  }
})
