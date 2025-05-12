import { Card, showAlert, TextInput, useTheme } from '@avalabs/k2-alpine'
import { Empty } from '@cubist-labs/cubesigner-sdk'
import { useFocusEffect } from '@react-navigation/native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TextInput as RNTextInput } from 'react-native'
import { TotpErrors } from 'seedless/errors'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Result } from 'types/result'
import Logger from 'utils/Logger'

export const VerifyCode = <T,>({
  onVerifyCode,
  onVerifySuccess
}: {
  onVerifyCode: (code: string) => Promise<Result<T, TotpErrors>>
  onVerifySuccess: (response: T | Empty) => void
}): React.JSX.Element => {
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

  const handleVerifyCode = useCallback(
    async (changedText: string): Promise<void> => {
      const numericText = changedText.replace(/[^0-9]/g, '')
      const cleanChangedText = numericText.replace(/\s/g, '')
      setCode(cleanChangedText)
      if (cleanChangedText.length < 6) {
        setShowError(false)
        return
      }

      try {
        const result = await onVerifyCode(cleanChangedText)
        if (result.success === false) {
          throw new Error(result.error.message)
        }
        onVerifySuccess(result.value)
        AnalyticsService.capture('TotpValidationSuccess')
      } catch (error) {
        setShowError(true)
        AnalyticsService.capture('TotpValidationFailed', {
          error: error as string
        })
      }
    },
    [onVerifyCode, onVerifySuccess]
  )

  const handleRetry = useCallback((): void => {
    setShowError(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        inputRef.current?.focus()
      }, 100) // Delay for navigation animations

      return () => clearTimeout(timeout)
    }, [])
  )

  useEffect(() => {
    if (showError) {
      showAlert({
        title: 'Incorrect code',
        description: 'The code you entered is incorrect.  please try again',
        buttons: [
          {
            text: 'Retry',
            style: 'default',
            onPress: handleRetry
          }
        ]
      })
    }
  }, [handleRetry, showError])

  return (
    <ScrollScreen
      title="Verify code"
      subtitle="Enter the code generated from your authenticator app"
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <Card
        sx={{
          marginTop: 24,
          height: 150
        }}>
        <TextInput
          ref={inputRef}
          containerSx={{
            flex: 1,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center'
          }}
          textInputSx={{
            flex: 1,
            fontFamily: 'Aeonik-Medium',
            fontSize: 60,
            lineHeight: 60,
            color: colors.$textPrimary
          }}
          textAlign="center"
          onBlur={() => inputRef.current?.focus()}
          maxLength={7}
          value={formattedCode}
          keyboardType="number-pad"
          onChangeText={changedText => {
            handleVerifyCode(changedText).catch(error =>
              Logger.error('handleVerifyCode', error)
            )
          }}
        />
      </Card>
    </ScrollScreen>
  )
}
