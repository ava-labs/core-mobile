import {
  BaseCard,
  Button,
  DEFAULT_CARD_WIDTH,
  getCardHeight,
  MaskedText,
  Text,
  View
} from '@avalabs/k2-alpine'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { DefiMarket } from '../types'
import { PROTOCOL_DISPLAY_NAMES } from '../consts'
import { DefiAssetLogo } from './DefiAssetLogo'

const BALANCE_MASK_WIDTH = 60

export const BorrowCard = ({
  market,
  borrowedAmountUsd,
  width = DEFAULT_CARD_WIDTH,
  onPress,
  onRepayPress
}: {
  market: DefiMarket
  borrowedAmountUsd: number
  width?: number
  onPress?: () => void
  onRepayPress: () => void
}): JSX.Element => {
  const height = getCardHeight(width)
  const { formatCurrency } = useFormatCurrency()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  const formattedBorrowAmount = useMemo(() => {
    return formatCurrency({ amount: borrowedAmountUsd })
  }, [formatCurrency, borrowedAmountUsd])

  return (
    <BaseCard
      onPress={onPress}
      sx={{ justifyContent: 'center', alignItems: 'center', width, height }}>
      <DefiAssetLogo
        asset={market.asset}
        network={market.network}
        width={62}
        networkLogoInset={-2}
      />
      <View
        sx={{ marginTop: 10, marginBottom: 20, gap: 2, alignItems: 'center' }}>
        <Text variant="buttonMedium" sx={{ color: '$textPrimary' }}>
          {market.asset.symbol} on {PROTOCOL_DISPLAY_NAMES[market.marketName]}
        </Text>
        <MaskedText
          variant="body2"
          sx={{ color: '$textSecondary' }}
          shouldMask={isPrivacyModeEnabled}
          maskWidth={BALANCE_MASK_WIDTH}>
          {formattedBorrowAmount}
        </MaskedText>
      </View>
      <View
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}>
        <Button type="secondary" size="small" onPress={onRepayPress}>
          Repay
        </Button>
      </View>
    </BaseCard>
  )
}
