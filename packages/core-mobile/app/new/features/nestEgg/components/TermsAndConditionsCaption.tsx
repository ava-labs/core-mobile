import React, { useCallback } from 'react'
import { Text, useTheme } from '@avalabs/k2-alpine'
import { Pressable } from 'react-native'
import { TERMS_OF_USE_URL } from 'common/consts/urls'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import { useRouter } from 'expo-router'

export const TermsAndConditionsCaption = (): JSX.Element => {
  const { openUrl } = useCoreBrowser()
  const router = useRouter()
  const { theme } = useTheme()

  const handleTermsAndConditionsPress = useCallback(() => {
    router.canDismiss() && router.dismissAll()
    openUrl({ url: TERMS_OF_USE_URL, title: 'Terms and Conditions' })
  }, [openUrl, router])

  return (
    <Text
      variant="caption"
      sx={{
        color: theme.colors.$textSecondary,
        fontFamily: 'Inter-Medium',
        paddingRight: 48
      }}>
      *Swapping does not guarantee qualification. Tokens are distributed at 2pm
      ET weekly on Mondays. Subject to availability and the Core{' '}
      <Pressable onPress={handleTermsAndConditionsPress}>
        <Text
          variant="caption"
          sx={{
            color: theme.colors.$textSecondary,
            fontFamily: 'Inter-Medium',
            textDecorationLine: 'underline',
            marginBottom: -3
          }}>
          terms and conditions
        </Text>
      </Pressable>
      .
    </Text>
  )
}
