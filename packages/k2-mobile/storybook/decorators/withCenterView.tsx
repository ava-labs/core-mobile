import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Story as SBStory } from '@storybook/react-native'

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export const withCenterView = (Story: SBStory): JSX.Element => (
  <View style={styles.main}>
    <Story />
  </View>
)
