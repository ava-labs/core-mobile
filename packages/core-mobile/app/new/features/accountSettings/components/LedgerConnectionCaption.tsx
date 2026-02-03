import { Text, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { LedgerAppType } from 'services/ledger/types'

export const LedgerConnectionCaption = ({
  appType
}: {
  appType: LedgerAppType
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <Text variant="caption" sx={{ color: colors.$textSecondary }}>
      {`Connect your Ledger device and open the ${appType} app to add an account. Make sure you connect the device that you used to create this wallet.`}
    </Text>
  )
}
