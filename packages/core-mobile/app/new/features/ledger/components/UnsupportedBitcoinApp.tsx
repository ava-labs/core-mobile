import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { HELP_URL } from 'common/consts/urls'
import { openInSystemBrowser } from 'utils/openInSystemBrowser'

const BITCOIN_RECOVERY_HELP_URL = `${HELP_URL}articles/13145665-why-doesn-t-my-bitcoin-ledger-application-work-with-core`

type UnsupportedBitcoinAppProps = {
  currentVersion: string
  onCancel: () => void
}

export const UnsupportedBitcoinApp = ({
  currentVersion,
  onCancel
}: UnsupportedBitcoinAppProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const handleLearnMore = (): void => {
    openInSystemBrowser(BITCOIN_RECOVERY_HELP_URL)
  }

  return (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24
      }}>
      <Icons.Custom.Ledger color={colors.$textPrimary} width={32} height={32} />
      <View sx={{ alignItems: 'center', gap: 12 }}>
        <Text
          variant="heading6"
          sx={{ textAlign: 'center', color: '$textPrimary' }}>
          Bitcoin app not supported
        </Text>
        <Text
          variant="body1"
          sx={{ textAlign: 'center', color: '$textSecondary' }}>
          {`Bitcoin app version ${currentVersion} is not supported. Please use the Bitcoin Recovery app instead.`}
        </Text>
        <Text
          variant="body1"
          sx={{ textAlign: 'center', color: '$textSecondary' }}>
          Open the{' '}
          <Text
            variant="body1"
            sx={{ fontFamily: 'Inter-SemiBold', color: '$textPrimary' }}>
            Bitcoin Recovery
          </Text>{' '}
          app on your Ledger device to continue.
        </Text>
      </View>
      <View sx={{ width: '100%', gap: 12 }}>
        <Button type="primary" size="large" onPress={onCancel}>
          Dismiss
        </Button>
        <Button type="tertiary" size="large" onPress={handleLearnMore}>
          Learn More
        </Button>
      </View>
    </View>
  )
}
