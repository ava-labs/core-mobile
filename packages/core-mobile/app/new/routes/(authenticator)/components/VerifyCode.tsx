import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  useTheme,
  Card,
  TextInput,
  Pressable
} from '@avalabs/k2-alpine'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import { TextInput as RNTextInput } from 'react-native'
import { Result } from 'types/result'
import { TotpErrors } from 'seedless/errors'

export const VerifyCode = ({
  onVerifyCode,
  onVerifySuccess
}: {
  onVerifyCode: (code: string) => Promise<Result<undefined, TotpErrors>>
  onVerifySuccess: () => void
}): React.JSX.Element => {
  const [isVerifying, setIsVerifying] = useState(false)
  const [code, setCode] = useState('')
  const [showError, setShowError] = useState(false)
  const inputRef = useRef<RNTextInput>(null)

  const {
    theme: { colors }
  } = useTheme()

  const cleanedInput = useMemo(() => {
    // Remove any existing spaces
    return code.replace(/\s/g, '')
  }, [code])

  const formattedCode = useMemo((): string => {
    // Add a space after every 3 digits
    return cleanedInput.replace(/(\d{3})(?=\d)/g, '$1 ')
  }, [cleanedInput])

  const handleVerifyCode = async (changedText: string): Promise<void> => {
    const numericText = changedText.replace(/[^0-9]/g, '')
    const cleanChangedText = numericText.replace(/\s/g, '')
    setCode(cleanChangedText)
    if (cleanChangedText.length < 6) {
      setShowError(false)
      return
    }

    setIsVerifying(true)

    try {
      const result = await onVerifyCode(cleanChangedText)
      if (result.success === false) {
        throw new Error(result.error.message)
      }
      setIsVerifying(false)
      onVerifySuccess()
      AnalyticsService.capture('TotpValidationSuccess')
    } catch (error) {
      setShowError(true)
      setIsVerifying(false)
      AnalyticsService.capture('TotpValidationFailed', {
        error: error as string
      })
    }
  }

  const handleTextInputFocus = (): void => {
    inputRef.current?.focus()
  }

  const textInputStyle = showError
    ? {
        borderColor: colors.$textDanger,
        borderWidth: 1
      }
    : undefined

  useEffect(() => {
    handleTextInputFocus()
  }, [])

  return (
    <BlurredBarsContentLayout>
      <View
        sx={{
          flex: 1,
          paddingTop: 25,
          paddingHorizontal: 16,
          justifyContent: 'space-between'
        }}>
        <View>
          <Text variant="heading2">Verify code</Text>
          <Text variant="body1" sx={{ marginTop: 8 }}>
            Enter the code generated from your authenticator app
          </Text>
          <Card
            sx={{
              marginTop: 34,
              height: 150,
              ...textInputStyle
            }}>
            <Pressable
              onPress={handleTextInputFocus}
              sx={{
                flex: 1,
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <TextInput
                ref={inputRef}
                selectionColor={colors.$textPrimary}
                sx={{
                  flex: 1,
                  fontFamily: 'Aeonik-Medium',
                  height: 44,
                  fontSize: 60,
                  lineHeight: 60,
                  color: colors.$textPrimary
                }}
                maxLength={7}
                editable={!isVerifying}
                value={formattedCode}
                keyboardType="number-pad"
                onChangeText={changedText => {
                  handleVerifyCode(changedText).catch(error =>
                    Logger.error('handleVerifyCode', error)
                  )
                }}
              />
            </Pressable>
          </Card>
          {showError && (
            <Text
              variant="body1"
              sx={{ color: colors.$textDanger, marginTop: 8 }}>
              Incorrect code. Try again.
            </Text>
          )}
        </View>
      </View>
    </BlurredBarsContentLayout>
  )
}
