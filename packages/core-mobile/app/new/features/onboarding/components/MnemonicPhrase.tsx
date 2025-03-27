import React from 'react'
import {
  ActivityIndicator,
  Button,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { copyToClipboard } from 'common/utils/clipboard'
import { BlurBackground } from 'common/components/BlurBackground'
import MnemonicAva from './MnemonicAva'

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
  const BLUR_BACKGROUND_COLOR = colors.$borderPrimary

  const mnemonics = (): JSX.Element => {
    const mnemonicRows = []
    const mnemonicArray = mnemonic ? mnemonic.split(' ') : EMPTY_MNEMONIC
    for (let i = 0; i < 8; i++) {
      mnemonicRows.push(
        mnemonicArray
          .slice(i * 3, i * 3 + 3)
          .map((value, key) => (
            <MnemonicAva.Text key={key} keyNum={i * 3 + key} text={value} />
          ))
      )
    }

    return (
      <>
        {mnemonicRows.map((row, index) => (
          <View
            key={index}
            style={{
              justifyContent: 'space-between',
              flexDirection: 'row'
            }}>
            {row}
          </View>
        ))}
      </>
    )
  }

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
            padding: 16,
            borderRadius: 12,
            justifyContent: 'space-between',
            marginTop: 8,
            alignContent: 'space-between',
            gap: 14,
            backgroundColor: colors.$surfaceSecondary
          }}>
          {isLoading ? (
            <View sx={{ height: 240, justifyContent: 'center' }}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            mnemonics()
          )}
          {hideMnemonic && (
            <BlurBackground
              opacity={1}
              tint="dark"
              borderRadius={8}
              backgroundColor={BLUR_BACKGROUND_COLOR}
            />
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
          <Button
            size="medium"
            style={{ width: 150 }}
            type="secondary"
            disabled={!mnemonic}
            onPress={handleCopyPhrase}
            testID="mnemonic_screen__copy_phrase_button">
            Copy phrase
          </Button>
        )}
      </View>
    </View>
  )
}

const EMPTY_MNEMONIC = [...Array(24).values()] as string[]
