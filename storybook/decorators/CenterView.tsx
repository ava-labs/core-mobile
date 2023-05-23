import React, { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

interface Props {
  children: ReactNode
}

const CenterView = ({ children }: Props): JSX.Element => {
  return <View style={styles.main}>{children}</View>
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default CenterView
