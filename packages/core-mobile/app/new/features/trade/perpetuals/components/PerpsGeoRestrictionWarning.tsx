import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { PERPS_HELP_URL } from 'common/consts/urls'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'
import React, { useCallback } from 'react'

const WARNING_TEXT =
  'Perpetual Futures may be restricted in your location due to local regulations.'

/**
 * Region-restriction notice for perps, shown in place of the trade CTA when the
 * user is geo-blocked (see {@link usePerpsAvailability}). The detail screen
 * stays browsable; only the trading surface is replaced by this warning.
 */
export const PerpsGeoRestrictionWarning = (): JSX.Element => {
  const { theme } = useTheme()
  const { openUrl } = useCoreBrowser()

  const handleLearnMore = useCallback(() => {
    openUrl({ url: PERPS_HELP_URL, title: 'Perpetual Futures' })
  }, [openUrl])

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
      }}>
      <Icons.Alert.ErrorOutline
        width={24}
        height={24}
        color={theme.colors.$textDanger}
      />
      <Text
        variant="body1"
        sx={{
          flex: 1,
          color: '$textDanger',
          fontFamily: 'Inter-Medium'
        }}>
        {WARNING_TEXT}
      </Text>
      <Button
        type="secondary"
        size="small"
        onPress={handleLearnMore}
        testID="perps-geo-learn-more">
        Learn more
      </Button>
    </View>
  )
}
