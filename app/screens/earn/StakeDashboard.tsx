import React from 'react'
import { View, StyleSheet } from 'react-native'
import AvaText from 'components/AvaText'
import { Balance } from './components/Balance'
import { StakeTabs } from './StakeTabs'

export const StakeDashboard = () => {
  return (
    <View style={styles.container}>
      <AvaText.LargeTitleBold>Stake</AvaText.LargeTitleBold>
      <Balance />
      <StakeTabs />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16
  }
})
