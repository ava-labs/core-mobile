import { Button, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import InputText from 'components/InputText'
import AppNavigation from 'navigation/AppNavigation'
import { OnboardScreenProps } from 'navigation/types'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setWalletName } from 'seedless/store/slice'

type NavigationProp = OnboardScreenProps<
  typeof AppNavigation.Onboard.NameYourWallet
>['navigation']

export const NameYourWallet = (): JSX.Element => {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const { navigate } = useNavigation<NavigationProp>()
  const {
    theme: { colors }
  } = useTheme()

  const isWalletNameValid = name.trim().length > 0

  const handleNext = (): void => {
    dispatch(setWalletName({ name }))
    navigate(AppNavigation.Root.Onboard, {
      screen: AppNavigation.Onboard.Welcome,
      params: {
        screen: AppNavigation.Onboard.AnalyticsConsent,
        params: {
          nextScreen: AppNavigation.Onboard.CreatePin
        }
      }
    })
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
        <Text variant="heading3">Name Your Wallet</Text>
        <Text variant="body1" sx={{ color: '$neutral50', marginVertical: 8 }}>
          Add a display name for your wallet. You can change it at anytime.
        </Text>
        <InputText
          autoFocus
          mode={'default'}
          onChangeText={setName}
          text={name}
          backgroundColor={colors.$transparent}
          textStyle={{
            fontFamily: 'Inter-Bold',
            fontSize: 48,
            lineHeight: 56,
            textAlign: 'right',
            alignSelf: 'center'
          }}
        />
      </View>
      <Button
        disabled={!isWalletNameValid}
        type="primary"
        size="xlarge"
        style={{ marginVertical: 16 }}
        onPress={handleNext}>
        Next
      </Button>
    </View>
  )
}
