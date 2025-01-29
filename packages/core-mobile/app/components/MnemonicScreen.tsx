import React from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import MnemonicAva from 'screens/onboarding/MnemonicAva'
import AvaButton from 'components/AvaButton'
import CopySVG from 'components/svg/CopySVG'
import { copyToClipboard } from 'utils/DeviceTools'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { RootStackScreenProps } from 'navigation/types'
import { Text, alpha, useTheme } from '@avalabs/k2-mobile'
import { BlurBackground } from './BlurBackground'

const EMPTY_MNEMONIC = [...Array(24).values()] as string[]

type Props = {
  mnemonic?: string
  hideMnemonic?: boolean
  testID?: string
  toggleRecoveryPhrase?: () => void
  canToggleBlur?: boolean
}

type CreateWalletNavigationProp = RootStackScreenProps<
  typeof AppNavigation.Root.CopyPhraseWarning
>['navigation']

export default function MnemonicScreen({
  mnemonic,
  hideMnemonic = false,
  canToggleBlur = false,
  toggleRecoveryPhrase
}: Props): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  const { isDarkMode } = useApplicationContext()
  const { navigate } = useNavigation<CreateWalletNavigationProp>()

  const BLUR_BACKGROUND_COLOR =
    Platform.OS === 'ios' ? '#BFBFBF70' : colors.$neutral900

  const mnemonics = (): JSX.Element => {
    const mnemonicColumns: JSX.Element[][] = [[], [], []]

    const menomicArray = mnemonic ? mnemonic.split(' ') : EMPTY_MNEMONIC
    menomicArray.forEach((value, key) => {
      const column = Math.floor(key / 8)
      const columnToPush = mnemonicColumns[column]
      if (columnToPush) {
        columnToPush.push(
          <MnemonicAva.Text key={key} keyNum={key} text={value} />
        )
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
    navigate(AppNavigation.Root.CopyPhraseWarning, {
      copy: () => {
        copyToClipboard(mnemonic)
      }
    })
  }

  return (
    <View style={{ flex: 1 }}>
      <AvaText.Body1 testID="menemonic_screen__new_recovery_phrase_instructions">
        Write down the recovery phrase and store it in a secure location.
      </AvaText.Body1>
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
              backgroundColor: isDarkMode
                ? alpha(colors.$neutral800, 0.3)
                : colors.$black
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
        {canToggleBlur ? (
          <Text
            variant="buttonMedium"
            sx={{ color: '$blueMain' }}
            onPress={toggleRecoveryPhrase}>
            {`${hideMnemonic ? 'Show' : 'Hide'} Recovery Phrase`}
          </Text>
        ) : (
          <>
            <View />
            <AvaButton.TextWithIcon
              disabled={!mnemonic}
              onPress={handleCopyPhrase}
              icon={<CopySVG />}
              testID="mnemonic_screen__copy_phrase_button"
              text={
                <AvaText.ButtonMedium
                  textStyle={{ color: colors.$white }}
                  testID="mnemonic_screen__copy_phrase_button">
                  Copy Phrase
                </AvaText.ButtonMedium>
              }
            />
          </>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  mnemonics: {
    paddingHorizontal: 8,
    paddingVertical: 20,
    borderRadius: 8,
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
