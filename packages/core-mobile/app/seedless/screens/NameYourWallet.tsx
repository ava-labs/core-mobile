import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useFocusEffect } from '@react-navigation/native'
import InputText from 'components/InputText'
import React, { useCallback, useRef, useState } from 'react'
import { TextInput } from 'react-native'

export const NameYourWallet = ({
  onSetWalletName
}: {
  onSetWalletName: (name: string) => void
}): JSX.Element => {
  const textInputRef = useRef<TextInput>(null)
  const [name, setName] = useState('')
  const {
    theme: { colors }
  } = useTheme()
  const [containerWidth, setContainerWidth] = useState(0)
  const [textWidth, setTextWidth] = useState(0)

  useFocusEffect(useCallback(() => textInputRef.current?.focus(), []))

  const handleSubmit = (): void => {
    const trimmed = name.trim()
    onSetWalletName(trimmed)
  }

  const shouldShowLongText = textWidth >= containerWidth

  return (
    <View
      sx={{
        paddingHorizontal: 16,
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: '$black'
      }}>
      <View
        onLayout={event => setContainerWidth(event.nativeEvent.layout.width)}>
        <Text variant="heading3" testID="name_your_wallet_title">
          Name Your Wallet
        </Text>
        <Text variant="body1" sx={{ color: '$neutral50', marginVertical: 8 }}>
          Add a display name for your wallet. You can change it at anytime.
        </Text>
        <InputText
          onLayout={event => setTextWidth(event.nativeEvent.layout.width)}
          testID="name_your_wallet_input"
          ref={textInputRef}
          placeholder={'Wallet Name'}
          autoCorrect={false}
          autoFocus
          mode={'default'}
          onChangeText={text => {
            const trimmed = text.trimStart()
            setName(trimmed)
          }}
          onSubmit={handleSubmit}
          text={name}
          backgroundColor={colors.$transparent}
          style={{ marginHorizontal: 0, marginBottom: 0, left: 8 }}
          textStyle={{
            fontFamily: 'Inter-Bold',
            fontSize: 48,
            lineHeight: 56,
            textAlign: 'justify',
            paddingStart: 8
          }}
          inputTextContainerStyle={{
            flexDirection: 'row',
            alignItems: 'center'
          }}
          clearBtnContainerSx={{
            justifyContent: 'center',
            alignItems: 'center',
            right: 16,
            position: 'relative'
          }}
        />
        {shouldShowLongText && (
          <View sx={{ alignItems: 'center' }}>
            <Text variant="caption" sx={{ color: '$neutral400' }}>
              {name}
            </Text>
          </View>
        )}
      </View>
      <Button
        disabled={name.length <= 0}
        type="primary"
        size="xlarge"
        style={{ marginVertical: 16 }}
        onPress={handleSubmit}>
        Next
      </Button>
    </View>
  )
}
