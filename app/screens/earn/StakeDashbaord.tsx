import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import { useApplicationContext } from 'contexts/ApplicationContext'
import DotSVG from 'components/svg/DotSVG'
import { DonutChart } from './components/DonutChart'

const renderCustomLabel = (title: string, selected: boolean, color: string) => {
  return <AvaText.Heading3 textStyle={{ color }}>{title}</AvaText.Heading3>
}

export const StakeDashboard = () => {
  const { theme } = useApplicationContext()

  const stakeData = {
    available: { type: 'Available', amount: 53.25 },
    staked: { type: 'Staked', amount: 53.25 },
    claimable: { type: 'Claimable', amount: 52.25 }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'Available':
        return theme.blueDark
      case 'Claimable':
        return theme.neutralSuccessLight
      default:
        return theme.white
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <AvaText.LargeTitleBold>Stake</AvaText.LargeTitleBold>
      </View>
      <View style={styles.stakeDetailsContainer}>
        <DonutChart
          stakedAmount={stakeData.staked.amount}
          availableAmount={stakeData.available.amount}
          claimableAmount={stakeData.claimable.amount}
        />
        <View style={{ marginLeft: 24 }}>
          {Object.values(stakeData).map(item => {
            const iconColor = getIconColor(item.type)
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
      </View>

      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <TabViewAva.Item title={'Active'}>
          <View>
            <AvaText.Heading1>Active</AvaText.Heading1>
          </View>
        </TabViewAva.Item>
        <TabViewAva.Item title={'History'}>
          <View>
            <AvaText.Heading1>History</AvaText.Heading1>
          </View>
        </TabViewAva.Item>
      </TabViewAva>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  },
  stakeDetailsContainer: {
    flexDirection: 'row',
    marginVertical: 24,
    marginHorizontal: 40
  },
  rowContainer: { flexDirection: 'row', alignItems: 'center' },
  textRowContainer: { flexDirection: 'row', alignItems: 'flex-end' }
})
