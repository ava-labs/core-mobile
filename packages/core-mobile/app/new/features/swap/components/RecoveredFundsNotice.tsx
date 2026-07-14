import React from 'react'
import { Icons, Text, View, useTheme } from '@avalabs/k2-alpine'

/**
 * Informational note shown when a cross-chain swap includes AVAX recovered from
 * a previous incomplete transfer (SDK `getRecoveredAtomicAmount` > 0n). Explains why
 * the received amount can exceed what was sent.
 *
 * Shared by the swap screen (driven by the live quote) and the swap
 * status/success screen (driven by the stored transfer). Callers decide *when*
 * to render it and pass screen-specific spacing (`sx`); the copy, info icon,
 * layout, typography, and primary color are shared here.
 */
export const RecoveredFundsNotice = ({
  sx
}: {
  sx?: React.ComponentProps<typeof View>['sx']
}): JSX.Element => {
  const { theme } = useTheme()
  return (
    <View sx={{ flexDirection: 'row', gap: 12, alignItems: 'center', ...sx }}>
      <Icons.Action.Info
        color={theme.colors.$textPrimary}
        width={24}
        height={24}
      />
      <Text
        sx={{
          flexShrink: 1,
          fontFamily: 'Inter-Medium',
          fontSize: 15,
          lineHeight: 20,
          letterSpacing: 0,
          color: '$textPrimary'
        }}>
        Includes AVAX recovered from a previous incomplete cross-chain transfer.
      </Text>
    </View>
  )
}
