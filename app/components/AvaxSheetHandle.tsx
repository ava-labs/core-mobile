import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

export default function AvaxSheetHandle() {
  const { theme } = useApplicationContext()
  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: theme.colorText2 }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 10
  },

  indicator: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'red'
  }
})
