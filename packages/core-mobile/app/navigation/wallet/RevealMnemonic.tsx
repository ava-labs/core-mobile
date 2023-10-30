import React, { useEffect } from 'react'
import { NativeModules, Platform, StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import { useNavigation, useRoute } from '@react-navigation/native'
import MnemonicScreen from 'components/MnemonicScreen'
import AppNavigation from 'navigation/AppNavigation'
import { SecurityPrivacyScreenProps } from 'navigation/types'

type RouteProp = SecurityPrivacyScreenProps<
  typeof AppNavigation.SecurityPrivacy.RecoveryPhrase
>['route']

export default function RevealMnemonic(): JSX.Element {
  const { goBack } = useNavigation()
  const { mnemonic } = useRoute<RouteProp>().params

  const handleSaveMyPhrase = (): void => {
    goBack()
  }

  useEffect(() => {
    if (Platform.OS === 'android') {
      const { SecureActivity } = NativeModules
      SecureActivity.onCreate()
      return () => {
        SecureActivity.onDestroy()
      }
    }
  }, [])

  return (
    <View style={styles.verticalLayout}>
      {/* This serves as grouping so we can achieve desired behavior with `justifyContent: 'space-between'`   */}
      <MnemonicScreen mnemonic={mnemonic} />

      {/* This serves as grouping so we can achieve desired behavior with `justifyContent: 'space-between'`   */}
      <View style={{ marginTop: 28, marginBottom: 40 }}>
        <AvaButton.PrimaryLarge
          disabled={!mnemonic}
          onPress={handleSaveMyPhrase}
          testID="reveal_mnemonic__i_wrote_it_down_button">
          I wrote it down
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  verticalLayout: {
    flex: 1,
    marginHorizontal: 16
  }
})
