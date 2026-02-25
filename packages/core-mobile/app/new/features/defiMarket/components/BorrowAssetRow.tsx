import React from 'react'
import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { Network } from '@avalabs/core-chains-sdk'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { DeFiRowItem } from 'features/portfolio/defi/components/DeFiRowItem'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { DefiAssetDetails } from '../types'
import { DefiAssetLogo } from './DefiAssetLogo'

const LOGO_SIZE = 42

interface BorrowAssetRowProps {
  asset: DefiAssetDetails
  network: Network
  label: string
  labelColor?: string
  amount: number
  amountUsd: number
}

export function BorrowAssetRow({
  asset,
  network,
  label,
  labelColor,
  amount,
  amountUsd
}: BorrowAssetRowProps): JSX.Element {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const { formatCurrency } = useFormatCurrency()
  const { theme } = useTheme()

  const resolvedLabelColor = labelColor ?? theme.colors.$textPrimary

  return (
    <DeFiRowItem>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12
        }}>
        <DefiAssetLogo
          asset={asset}
          network={network}
          width={LOGO_SIZE}
          networkLogoInset={-2}
        />
        <Text
          variant="heading6"
          numberOfLines={1}
          ellipsizeMode="tail"
          sx={{ color: '$textPrimary', flexShrink: 1 }}>
          {asset.symbol}
        </Text>
      </View>
      {isPrivacyModeEnabled ? (
        <HiddenBalanceText variant="body1" sx={{ color: '$textSecondary' }} />
      ) : (
        <View sx={{ alignItems: 'flex-end' }}>
          <Text variant="body2" sx={{ color: resolvedLabelColor }}>
            {label}
          </Text>
          <Text
            variant="heading2"
            sx={{ color: '$textPrimary', fontWeight: '500' }}>
            {formatNumber(amount)}
          </Text>
          <Text
            variant="subtitle2"
            sx={{ color: '$textSecondary', lineHeight: 13 }}>
            {formatCurrency({ amount: amountUsd })}
          </Text>
        </View>
      )}
    </DeFiRowItem>
  )
}
