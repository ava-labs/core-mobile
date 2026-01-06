import {
  BaseCard,
  Button,
  DEFAULT_CARD_WIDTH,
  getCardHeight,
  Text,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { useExchangedAmount } from 'common/hooks/useExchangedAmount'
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
        <Text variant="body2" sx={{ color: '$textSecondary' }}>
          {getAmount(
            market.asset.mintTokenBalance.balanceValue.value.toNumber()
          )}
        </Text>
      </View>
      <Button type="secondary" size="small" onPress={onWithdrawPress}>
        Withdraw
      </Button>
    </BaseCard>
  )
}
