import React from 'react'
import { StyleSheet, View } from 'react-native'

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withCenterView = (Story: any): React.JSX.Element => (
  <View style={styles.main}>
    <Story />
  </View>
)
