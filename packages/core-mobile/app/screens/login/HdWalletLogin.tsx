import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import WalletSDK from 'utils/WalletSDK'
import TextArea from 'components/TextArea'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import * as bip39 from 'bip39'
import { useAnalytics } from 'hooks/useAnalytics'

type Props = {
  onEnterWallet: (mnemonic: string) => void
  onBack: () => void
}

export default function HdWalletLogin(props: Props): JSX.Element {
  const { capture } = useAnalytics()
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )

  const onEnterTestWallet = (): void => {
    onEnterWallet(WalletSDK.testMnemonic())
  }

  const onBack = (): void => {
    props.onBack()
  }

  const onEnterWallet = (mnemonic: string): void => {
    const trimmed = mnemonic.trim()
    const isValid = bip39.validateMnemonic(trimmed)
    try {
      if (isValid) {
        capture('OnboardingMnemonicImported')
        props.onEnterWallet(trimmed)
      } else {
        throw new Error()
      }
    } catch (e) {
      setErrorMessage('Invalid recovery phrase')
    }
  }

  // eslint-disable-next-line react/no-unstable-nested-components
  const EnterTestWalletButton = (): JSX.Element | null => {
    return __DEV__ ? (
      <AvaButton.TextLarge
        onPress={onEnterTestWallet}
        testID="hd_wallet_login__test_wallet">
        Enter test HD wallet
      </AvaButton.TextLarge>
    ) : null
  }

  return (
    <ScrollView
      contentContainerStyle={styles.fullHeight}
      keyboardShouldPersistTaps="handled">
      <View
        style={{
          marginHorizontal: 16,
          justifyContent: 'center'
        }}>
        <AvaText.LargeTitleBold testID="recovery_phrase__header">
          Recovery Phrase
        </AvaText.LargeTitleBold>
      </View>
      <View style={[{ flexGrow: 1, justifyContent: 'flex-end' }]}>
        <EnterTestWalletButton />
        <View style={[{ padding: 16 }]}>
          <TextArea
            autoFocus
            btnPrimaryText={'Sign in'}
            btnSecondaryText={'Cancel'}
            onBtnSecondary={onBack}
            onChangeText={() => setErrorMessage(undefined)}
            errorMessage={errorMessage}
            onBtnPrimary={onEnterWallet}
            autoCorrect={false}
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  fullHeight: {
    flexGrow: 1
  },
  overlay: {
    position: 'absolute',
    height: '100%',
    width: '100%'
  }
})
