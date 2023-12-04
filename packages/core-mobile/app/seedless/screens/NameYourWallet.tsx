import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useFocusEffect } from '@react-navigation/native'
import InputText from 'components/InputText'
import React, { useCallback, useRef, useState } from 'react'
import { TextInput } from 'react-native'
import { useDispatch } from 'react-redux'
import { setWalletName } from 'store/account'

export const NameYourWallet = ({
  onSetWalletName
}: {
  onSetWalletName: () => void
}): JSX.Element => {
  const textInputRef = useRef<TextInput>(null)
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const {
    theme: { colors }
  } = useTheme()

  useFocusEffect(useCallback(() => textInputRef.current?.focus(), []))

  const handleSubmit = (): void => {
    dispatch(setWalletName({ name }))
    onSetWalletName()
  }

  return (
    <View
      sx={{
        paddingHorizontal: 16,
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: '$black'
      }}>
      <View>
        <Text variant="heading3" testID="name_your_wallet_title">
          Name Your Wallet
        </Text>
        <Text variant="body1" sx={{ color: '$neutral50', marginVertical: 8 }}>
          Add a display name for your wallet. You can change it at anytime.
        </Text>
        <InputText
          testID="name_your_wallet_input"
          ref={textInputRef}
          placeholder={'Wallet Name'}
          autoCorrect={false}
          autoFocus
          mode={'default'}
          onChangeText={setName}
          onSubmit={handleSubmit}
          text={name}
          backgroundColor={colors.$transparent}
          style={{ marginHorizontal: 0, marginBottom: 0 }}
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
        />
        <View sx={{ alignItems: 'center' }}>
          <Text variant="caption" sx={{ color: '$neutral400' }}>
            {name}
          </Text>
        </View>
      </View>
      <Button
        type="primary"
        size="xlarge"
        style={{ marginVertical: 16 }}
        onPress={handleSubmit}>
        Next
      </Button>
    </View>
  )
}
