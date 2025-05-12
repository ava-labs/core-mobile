import {
  Button,
  Icons,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { MnemonicText } from 'common/components/MnemonicText'
import NavigationBarButton from 'common/components/NavigationBarButton'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { Space } from 'common/components/Space'
import React, { useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { SHOW_RECOVERY_PHRASE } from '../consts'

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

  const handleCopyPhrase = useCallback(() => {
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
  }, [mnemonic, onCopyPhrase])

  const renderHeaderRight = useCallback(() => {
    return (
      <NavigationBarButton>
        {hideMnemonic ? (
          <Icons.Action.VisibilityOff
            color={colors.$textSecondary}
            onPress={toggleRecoveryPhrase}
            hitSlop={16}
          />
        ) : (
          <Icons.Action.VisibilityOn
            color={colors.$textPrimary}
            onPress={toggleRecoveryPhrase}
            hitSlop={16}
          />
        )}
      </NavigationBarButton>
    )
  }, [
    colors.$textPrimary,
    colors.$textSecondary,
    hideMnemonic,
    toggleRecoveryPhrase
  ])

  const renderFooter = useCallback(() => {
    return (
      <Button
        size="medium"
        type="secondary"
        disabled={!mnemonic}
        onPress={handleCopyPhrase}
        style={{ width: 120 }}
        testID="mnemonic_screen__copy_phrase_button">
        Copy phrase
      </Button>
    )
  }, [mnemonic, handleCopyPhrase])

  return (
    <ScrollScreen
      title={SHOW_RECOVERY_PHRASE}
      renderHeaderRight={renderHeaderRight}
      renderFooter={renderFooter}
      //  testID="menemonic_screen__new_recovery_phrase_instructions"
      subtitle="This phrase is your access key to your wallet. Carefully write it down and store it in a safe location"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        padding: 16
      }}>
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
    </ScrollScreen>
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
