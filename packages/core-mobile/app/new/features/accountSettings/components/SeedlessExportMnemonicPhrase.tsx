import React from 'react'
import { StyleSheet } from 'react-native'
import { Space } from 'components/Space'
import {
  Button,
  Text,
  showAlert,
  useTheme,
  View,
  Icons
} from '@avalabs/k2-alpine'
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
        marginHorizontal: 16
      }}>
      <Text variant="heading2">Show recovery phrase</Text>
      <Text
        variant="body1"
        sx={{ marginTop: 24, marginRight: 64 }}
        testID="menemonic_screen__new_recovery_phrase_instructions">
        This phrase is your access key to your wallet. Carefully write it down
        and store it in a safe location
      </Text>
      <Space y={21} />
      <View
        sx={{
          borderRadius: 8,
          backgroundColor: '$surfacePrimary',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12
        }}>
        <Icons.Action.Info color={colors.$textDanger} />
        <Text
          sx={{
            color: colors.$textDanger,
            fontSize: 13,
            lineHeight: 16,
            marginRight: 16
          }}>
          {'Losing this phrase will result in lost funds'}
        </Text>
      </View>
      <Space y={17} />
      <View
        sx={{
          height: 336,
          width: '100%',
          backgroundColor: colors.$surfaceSecondary,
          borderRadius: 8
        }}>
        <View
          style={[
            styles.mnemonics,
            {
              opacity: hideMnemonic ? 0 : 1
            }
          ]}>
          {mnemonics()}
        </View>
      </View>
      <View
        sx={{
          marginTop: 16,
          marginBottom: 60,
          gap: 16,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Button
          size="medium"
          type="secondary"
          style={{ width: 120 }}
          onPress={toggleRecoveryPhrase}
          testID="mnemonic_screen__copy_phrase_button">
          {`${hideMnemonic ? 'Show' : 'Hide'} phrase`}
        </Button>
        <Button
          size="medium"
          type="secondary"
          disabled={!mnemonic}
          onPress={handleCopyPhrase}
          style={{ width: 120 }}
          testID="mnemonic_screen__copy_phrase_button">
          Copy phrase
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  mnemonics: {
    borderRadius: 8,
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
