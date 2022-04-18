import React from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import AnimatedCoreXLogo from 'components/AnimatedCoreXLogo'

const pkg = require('../../../package.json')

export default function Splash({ noAnim }: { noAnim?: boolean }): JSX.Element {
  const { theme } = useApplicationContext()

  return (
    <SafeAreaView style={{ backgroundColor: theme.colorBg1 }}>
      <View
        style={[styles.verticalLayout, { backgroundColor: theme.colorBg1 }]}>
        <AnimatedCoreXLogo finalState={noAnim} />
        <AvaText.Body2 textStyle={{ position: 'absolute', top: 0, left: 16 }}>
          v{pkg.version}
        </AvaText.Body2>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  verticalLayout: {
    padding: 16,
    height: '100%'
  }
})
