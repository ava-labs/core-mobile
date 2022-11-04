import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import MnemonicAva from 'screens/onboarding/MnemonicAva'
import AvaButton from 'components/AvaButton'
import CopySVG from 'components/svg/CopySVG'
import { copyToClipboard } from 'utils/DeviceTools'
import { Opacity30 } from 'resources/Constants'

type Props = {
  mnemonic: string
  testID?: string
}

export default function MnemonicScreen({ mnemonic }: Props) {
  const { theme, isDarkMode } = useApplicationContext()

  const mnemonics = () => {
    const mnemonics: Element[] = []
    mnemonic?.split(' ').forEach((value, key) => {
      mnemonics.push(<MnemonicAva.Text key={key} keyNum={key} text={value} />)
    })
    return mnemonics
  }

  return (
    <View style={{ flex: 1 }}>
      <AvaText.Body1 testID="newRecoverPhraseInstructions">
        Write down the recovery phrase and store it in a secure location.
      </AvaText.Body1>
      <Space y={24} />
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

      <View style={{ alignSelf: 'flex-end', marginTop: 16 }}>
        <AvaButton.TextWithIcon
          disabled={!mnemonic}
          onPress={() => copyToClipboard(mnemonic)}
          icon={<CopySVG />}
          testID="copyPhraseBtn"
          text={
            <AvaText.ButtonMedium
              textStyle={{ color: theme.alternateBackground }}
              testID="copyPhraseBtn">
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
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 8,
    maxHeight: 310,
    alignContent: 'space-between'
  }
})
