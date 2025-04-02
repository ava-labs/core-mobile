import React, { useCallback } from 'react'
import {
  ActivityIndicator,
  Button,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { copyToClipboard } from 'common/utils/clipboard'
import { StyleSheet } from 'react-native'
import { MnemonicText } from 'common/components/MnemonicText'

export default function MnemonicPhrase({
  mnemonic,
  hideMnemonic = false,
  canToggleBlur = false,
  isLoading = false,
  toggleRecoveryPhrase,
  onCopyPhrase
}: {
  mnemonic?: string
  hideMnemonic?: boolean
  testID?: string
  toggleRecoveryPhrase?: () => void
  canToggleBlur?: boolean
  isLoading?: boolean
  onCopyPhrase?: (mnemonic?: string) => void
}): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()

  const renderMnemonics = useCallback((): JSX.Element => {
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
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          flex: 1
        }}>
        <View>{mnemonicColumns[0]}</View>
        <View>{mnemonicColumns[1]}</View>
        <View>{mnemonicColumns[2]}</View>
      </View>
    )
  }, [mnemonic])

  const handleCopyPhrase = (): void => {
    onCopyPhrase ? onCopyPhrase(mnemonic) : copyToClipboard(mnemonic)
  }

  return (
    <View>
      <View
        style={{
          flexGrow: 0
        }}>
        <View
          sx={{
            borderRadius: 12,
            marginTop: 8,
            backgroundColor: colors.$surfaceSecondary,
            overflow: 'hidden'
          }}>
          {isLoading ? (
            <View sx={{ height: 290, justifyContent: 'center' }}>
              <ActivityIndicator size="small" />
            </View>
          ) : (
            <View
              sx={{
                height: 290,
                backgroundColor: colors.$surfaceSecondary
              }}>
              <View
                style={[
                  styles.mnemonics,
                  {
                    opacity: hideMnemonic ? 0 : 1
                  }
                ]}>
                {renderMnemonics()}
              </View>
            </View>
          )}
        </View>
      </View>
      <View
        style={{
          marginTop: 16,
          alignItems: 'center'
        }}>
        {canToggleBlur ? (
          <Text
            variant="buttonMedium"
            sx={{ color: '$textPrimary' }}
            onPress={toggleRecoveryPhrase}>
            {`${hideMnemonic ? 'Show' : 'Hide'} Recovery Phrase`}
          </Text>
        ) : (
          <View>
            <Button
              size="medium"
              type="secondary"
              disabled={!mnemonic}
              onPress={handleCopyPhrase}
              testID="mnemonic_screen__copy_phrase_button">
              Copy phrase
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}

const EMPTY_MNEMONIC = [...Array(24).values()] as string[]

const styles = StyleSheet.create({
  mnemonics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16
  }
})
