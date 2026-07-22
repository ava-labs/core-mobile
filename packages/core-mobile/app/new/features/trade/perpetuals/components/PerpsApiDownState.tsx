import { Button, Text, View } from '@avalabs/k2-alpine'
import React from 'react'

/** 🤒 — shown when our trading partner (Hyperliquid) is unreachable. */
const EMOJI = String.fromCodePoint(0x1f912)
const TITLE = 'Uh-oh!'
const MESSAGE =
  "Our trading partner is currently experiencing some difficulties. Don't worry though, your funds and positions are safe."

/**
 * Full-content empty state shown when the Hyperliquid API is down / the perps
 * manager fails to initialize (e.g. a 429 or outage). Mirrors core-web's
 * `PerpsInitErrorEmptyState`. Reassures the user their funds are safe and, when
 * `onRetry` is provided, offers a retry.
 */
export const PerpsApiDownState = ({
  onRetry
}: {
  onRetry?: () => void
}): JSX.Element => {
  return (
    <View
      testID="perps-api-down"
      sx={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 16
      }}>
      <Text style={{ fontSize: 42, lineHeight: 46, textAlign: 'center' }}>
        {EMOJI}
      </Text>
      <View sx={{ alignItems: 'center', gap: 8 }}>
        <Text variant="heading3" sx={{ textAlign: 'center' }}>
          {TITLE}
        </Text>
        <Text
          variant="subtitle1"
          sx={{ textAlign: 'center', color: '$textSecondary' }}>
          {MESSAGE}
        </Text>
      </View>
      {onRetry !== undefined ? (
        <Button
          type="secondary"
          size="small"
          onPress={onRetry}
          testID="perps-api-down-retry">
          Retry
        </Button>
      ) : null}
    </View>
  )
}
