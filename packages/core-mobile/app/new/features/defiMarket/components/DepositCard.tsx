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
import { PROTOCOL_DISPLAY_NAMES } from '../consts'
import { DefiMarketAssetLogo } from './DefiMarketAssetLogo'

const BALANCE_MASK_WIDTH = 60

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
      accessible={false}
      sx={{ justifyContent: 'center', alignItems: 'center', width, height }}>
      <DefiMarketAssetLogo market={market} />
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
          {getAmount(
            market.asset.mintTokenBalance.balanceValue.value.toNumber()
          )}
        </MaskedText>
      </View>
      <View
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}>
        <Button
          accessible={true}
          testID={`withdraw_btn__${market.marketName}__${market.asset.symbol}`}
          type="secondary"
          size="small"
          onPress={onWithdrawPress}>
          Withdraw
        </Button>
      </View>
    </BaseCard>
  )
}
