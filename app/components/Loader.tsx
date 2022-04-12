import React from 'react'
import {ActivityIndicator, SafeAreaView, StyleSheet, View} from 'react-native'
import {useApplicationContext} from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'

type LoaderProps = {
  message?: string
  showLogo?: boolean
  transparent?: boolean
}

export default function Loader({
  message,
  transparent
}: LoaderProps): JSX.Element {
  const context = useApplicationContext()

  return (
    <SafeAreaView
      style={[
        context.appBackgroundStyle,
        transparent && {backgroundColor: context.theme.transparent}
      ]}>
      <View
        style={[
          context.backgroundStyle,
          transparent && {backgroundColor: context.theme.transparent}
        ]}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={context.theme.colorPrimary1} />
          {!!message && (
            <AvaText.LargeTitleRegular textStyle={{alignSelf: 'center'}}>
              {message}
            </AvaText.LargeTitleRegular>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center'
  }
})
