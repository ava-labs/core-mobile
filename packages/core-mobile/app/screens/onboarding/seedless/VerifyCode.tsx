import {
  Button,
  Pressable,
  Text,
  TextInput,
  View,
  alpha,
  useTheme
} from '@avalabs/k2-mobile'
import React, { useState } from 'react'
import { BottomSheet } from 'components/BottomSheet'
import ClearSVG from 'components/svg/ClearSVG'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { RecoveryMethodsScreenProps } from 'navigation/types'

type VerifyCodeScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.LearnMore
>

export const VerifyCode = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [code, setCode] = useState('')

  const [showError, setShowError] = useState(false)
  const { canGoBack, goBack } =
    useNavigation<VerifyCodeScreenProps['navigation']>()

  const onGoBack = (): void => {
    if (canGoBack()) {
      goBack()
    }
  }

  const handleVerifyCode = (): void => {
    // todo: if code is incorrect, show error
    setShowError(true)
    // todo: else go to next screen
  }

  const textInputStyle = showError
    ? {
        borderColor: '$dangerLight',
        borderWidth: 1
      }
    : undefined

  return (
    <BottomSheet snapPoints={['99%']}>
      <View
        sx={{ marginHorizontal: 16, justifyContent: 'space-between', flex: 1 }}>
        <View>
          <View
            sx={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
            <Text variant="heading4">VerifyCode</Text>
            <Pressable onPress={onGoBack}>
              <ClearSVG
                backgroundColor={alpha(colors.$neutral700, 0.5)}
                color={colors.$neutral500}
                size={30}
              />
            </Pressable>
          </View>
          <Space y={24} />
          <Text variant="body1">
            Enter the code generated from your authenticator app.
          </Text>
          <Space y={24} />
          <TextInput
            onChangeText={setCode}
            keyboardType="number-pad"
            keyboardAppearance="dark"
            multiline
            value={code}
            sx={{
              height: 116,
              backgroundColor: alpha(colors.$neutral700, 0.5),
              borderColor: '$dangerLight',
              borderRadius: 8,
              fontFamily: 'Inter-Bold',
              fontSize: 34,
              lineHeight: 44,
              color: '$neutral50',
              padding: 8,
              ...textInputStyle
            }}
          />
          {showError && (
            <Text
              variant="helperText"
              sx={{ color: '$dangerLight', marginTop: 8 }}>
              Incorrect code. Try again.
            </Text>
          )}
        </View>
        <Button
          type="primary"
          size="large"
          style={{ marginVertical: 16 }}
          onPress={handleVerifyCode}>
          Confirm
        </Button>
      </View>
    </BottomSheet>
  )
}
