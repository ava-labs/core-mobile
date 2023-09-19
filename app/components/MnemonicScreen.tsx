import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import MnemonicAva from 'screens/onboarding/MnemonicAva'
import AvaButton from 'components/AvaButton'
import CopySVG from 'components/svg/CopySVG'
import { copyToClipboard } from 'utils/DeviceTools'
import { Opacity30 } from 'resources/Constants'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { RootStackScreenProps } from 'navigation/types'

type Props = {
  mnemonic: string
  testID?: string
}

type CreateWalletNavigationProp = RootStackScreenProps<
  typeof AppNavigation.Root.CopyPhraseWarning
>['navigation']

export default function MnemonicScreen({ mnemonic }: Props) {
  const { theme, isDarkMode } = useApplicationContext()
  const { navigate } = useNavigation<CreateWalletNavigationProp>()

  const mnemonics = () => {
    const mnemonicColumns: Element[][] = [[], [], []]
    mnemonic?.split(' ').forEach((value, key) => {
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

  function handleCopyPhrase() {
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
                ? theme.colorBg3 + Opacity30
                : theme.colorBg1
            }
          ]}>
          {mnemonics()}
        </View>
      </ScrollView>

      <View style={{ alignSelf: 'flex-end', marginTop: 16 }}>
        <AvaButton.TextWithIcon
          disabled={!mnemonic}
          onPress={handleCopyPhrase}
          icon={<CopySVG />}
          testID="mnemonic_screen__copy_phrase_button"
          text={
            <AvaText.ButtonMedium
              textStyle={{ color: theme.alternateBackground }}
              testID="mnemonic_screen__copy_phrase_button">
              Copy Phrase
            </AvaText.ButtonMedium>
          }
        />
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
