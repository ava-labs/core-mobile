import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Button, Text, alpha, showAlert, useTheme } from '@avalabs/k2-alpine'
import { BlurBackground } from 'common/components/BlurBackground'
import { MnemonicText } from 'common/components/MnemonicText'

const EMPTY_MNEMONIC = [...Array(24).values()] as string[]

type Props = {
  mnemonic?: string
  hideMnemonic?: boolean
  testID?: string
  toggleRecoveryPhrase?: () => void
  onCopyPhrase: (mnemonic?: string) => void
}

export const SeedlessExportMnemonicPhrase = ({
  mnemonic,
  hideMnemonic = false,
  toggleRecoveryPhrase,
  onCopyPhrase
}: Props): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const BLUR_BACKGROUND_COLOR = alpha(colors.$surfaceSecondary, 0.1)

  const mnemonics = (): JSX.Element => {
    const mnemonicColumns: JSX.Element[][] = [[], [], []]

    const menomicArray = mnemonic ? mnemonic.split(' ') : EMPTY_MNEMONIC
    menomicArray.forEach((value, key) => {
      const column = Math.floor(key / 8)
      const columnToPush = mnemonicColumns[column]
      if (columnToPush) {
        columnToPush.push(<MnemonicText key={key} keyNum={key} text={value} />)
      }
    })

    return (
      <>
        <View style={styles.mnemonicColumn}>{mnemonicColumns[0]}</View>
        <View style={styles.mnemonicColumn}>{mnemonicColumns[1]}</View>
        <View style={styles.mnemonicColumn}>{mnemonicColumns[2]}</View>
      </>
    )
  }

  function handleCopyPhrase(): void {
    showAlert({
      title: 'Security Warning',
      description:
        'Copying your phrase can expose it to other apps on your device. It is best to write down your phrase instead.',
      buttons: [
        {
          text: 'Copy Anyway',
          style: 'default',
          onPress: () => onCopyPhrase(mnemonic)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    })
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'space-between',
        marginHorizontal: 16
      }}>
      <View>
        <Text variant="heading2">Show recovery phrase</Text>
        <Text
          variant="body1"
          sx={{ marginTop: 24 }}
          testID="menemonic_screen__new_recovery_phrase_instructions">
          Write down the recovery phrase and store it in a secure location.
        </Text>
        <Space y={24} />
        <ScrollView
          style={{
            flexGrow: 0
          }}
          contentContainerStyle={{ minWidth: '100%' }}
          horizontal>
          <View
            style={[
              styles.mnemonics,
              {
                backgroundColor: colors.$surfaceSecondary
              }
            ]}>
            {mnemonics()}
            {hideMnemonic && (
              <BlurBackground
                opacity={1}
                tint="dark"
                borderRadius={8}
                backgroundColor={BLUR_BACKGROUND_COLOR}
              />
            )}
          </View>
        </ScrollView>
        <View
          style={{
            justifyContent: 'space-between',
            marginTop: 16,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          <Text
            variant="buttonMedium"
            sx={{ color: '$textPrimary' }}
            onPress={toggleRecoveryPhrase}>
            {`${hideMnemonic ? 'Show' : 'Hide'} Recovery Phrase`}
          </Text>
        </View>
      </View>
      <Button
        size="large"
        style={{ marginBottom: 60 }}
        type="primary"
        disabled={!mnemonic}
        onPress={handleCopyPhrase}
        testID="mnemonic_screen__copy_phrase_button">
        Copy phrase
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  mnemonics: {
    paddingHorizontal: 8,
    paddingVertical: 20,
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    marginTop: 8,
    maxHeight: 343,
    alignContent: 'space-between'
  },

  mnemonicColumn: {
    margin: 10,
    justifyContent: 'space-between',
    flexDirection: 'column',
    flex: 1
  }
})
