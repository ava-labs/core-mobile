import React, { useEffect } from 'react'
import { NativeModules, Platform, StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import MnemonicScreen from 'components/MnemonicScreen'

interface Props {
  mnemonic: string
  buttonText?: string
  onGoBack?: () => void
  canToggleBlur?: boolean
  buttonOverride?: JSX.Element
}

export default function RevealMnemonic({
  mnemonic,
  buttonText,
  onGoBack,
  canToggleBlur,
  buttonOverride
}: Props): JSX.Element {
  const handleSaveMyPhrase = (): void => {
    onGoBack?.()
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
      <MnemonicScreen mnemonic={mnemonic} canToggleBlur={canToggleBlur} />

      {/* This serves as grouping so we can achieve desired behavior with `justifyContent: 'space-between'`   */}
      <View style={{ marginTop: 28, marginBottom: 40 }}>
        {buttonOverride ?? (
          <AvaButton.PrimaryLarge
            disabled={!mnemonic}
            onPress={handleSaveMyPhrase}
            testID="reveal_mnemonic__i_wrote_it_down_button">
            {buttonText}
          </AvaButton.PrimaryLarge>
        )}
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
