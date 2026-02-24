import { Text, useTheme } from '@avalabs/k2-alpine'
import { TERMS_OF_USE_URL } from 'common/consts/urls'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import React, { useCallback } from 'react'
import { Pressable } from 'react-native'

export const TermsAndConditionsCaption = (): JSX.Element => {
  const { openUrl } = useInAppBrowser()
  const { theme } = useTheme()

  const handleTermsAndConditionsPress = useCallback(() => {
    openUrl(TERMS_OF_USE_URL)
  }, [openUrl])

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
