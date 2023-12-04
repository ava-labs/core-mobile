import { Text, View, useTheme } from '@avalabs/k2-mobile'
import InputText from 'components/InputText'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setWalletName } from 'store/account'

export const NameYourWallet = ({
  onSetWalletName
}: {
  onSetWalletName: () => void
}): JSX.Element => {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const {
    theme: { colors }
  } = useTheme()

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
          autoCorrect={false}
          autoFocus
          mode={'default'}
          onChangeText={setName}
          onSubmit={() => {
            dispatch(setWalletName({ name }))
            onSetWalletName()
          }}
          text={name}
          backgroundColor={colors.$transparent}
          style={{ marginHorizontal: 0 }}
          textStyle={{
            fontFamily: 'Inter-Bold',
            fontSize: 48,
            lineHeight: 56,
            textAlign: 'justify'
          }}
        />
      </View>
    </View>
  )
}
