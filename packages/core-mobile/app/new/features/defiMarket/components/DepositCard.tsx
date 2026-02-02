import {
  BaseCard,
  Button,
  DEFAULT_CARD_WIDTH,
  getCardHeight,
  MaskedText,
  Text,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { useSelector } from 'react-redux'
import { useExchangedAmount } from 'common/hooks/useExchangedAmount'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { DefiMarket } from '../types'
import { DefiMarketAssetLogo } from './DefiMarketAssetLogo'

export const DepositCard = ({
  market,
  width = DEFAULT_CARD_WIDTH,
  onPress,
  onWithdrawPress
}: {
  market: DefiMarket
  width?: number
  onPress: () => void
  onWithdrawPress: () => void
}): JSX.Element => {
  const height = getCardHeight(width)
  const getAmount = useExchangedAmount()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  return (
    <BaseCard
      onPress={onPress}
      sx={{ justifyContent: 'center', alignItems: 'center', width, height }}>
      <DefiMarketAssetLogo market={market} />
      <View
        sx={{ marginTop: 10, marginBottom: 20, gap: 2, alignItems: 'center' }}>
        <Text variant="buttonMedium" sx={{ color: '$textPrimary' }}>
          {market.asset.symbol} on {market.marketName}
        </Text>
        <MaskedText
          variant="body2"
          sx={{ color: '$textSecondary' }}
          shouldMask={isPrivacyModeEnabled}
          maskWidth={60}>
          {getAmount(
            market.asset.mintTokenBalance.balanceValue.value.toNumber()
          )}
        </MaskedText>
      </View>
      <View
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}>
        <Button type="secondary" size="small" onPress={onWithdrawPress}>
          Withdraw
        </Button>
      </View>
    </BaseCard>
  )
}
