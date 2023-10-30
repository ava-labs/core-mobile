import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { ActivityIndicator } from 'components/ActivityIndicator'

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
    <View
      style={[
        context.backgroundStyle,
        transparent && { backgroundColor: context.theme.transparent }
      ]}>
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        {!!message && (
          <AvaText.LargeTitleRegular textStyle={{ alignSelf: 'center' }}>
            {message}
          </AvaText.LargeTitleRegular>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center'
  }
})
