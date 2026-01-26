import { ActivityIndicator, Button, Text, View } from '@avalabs/k2-alpine'
import React, { useMemo } from 'react'
import { useExchangeRates } from 'common/hooks/useExchangeRates'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { formatCurrency as rawFormatCurrency } from 'utils/FormatCurrency'
import { AvailableRewardsData } from '../hooks/useAvailableRewards'
import { DefiMarketLogo } from './DefiMarketLogo'

const MINIMUM_DISPLAY_AMOUNT = 0.001

type RewardsBannerProps = {
  availableRewards: AvailableRewardsData
  onClaimPress: () => void
  isClaiming: boolean
}

export const RewardsBanner = ({
  availableRewards,
  onClaimPress,
  isClaiming
}: RewardsBannerProps): JSX.Element => {
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { data } = useExchangeRates()
  const { formatCurrency } = useFormatCurrency()
  const exchangeRate = data?.usd?.[selectedCurrency.toLowerCase()]
  const { totalRewardsFiat, rewards } = availableRewards

  const formattedTotalRewardsFiat = useMemo(() => {
    const baseAmount = totalRewardsFiat.toNumber()
    const hasExchangeRate = exchangeRate !== undefined
    const amountInCurrency = hasExchangeRate
      ? baseAmount * exchangeRate
      : baseAmount

    if (amountInCurrency < MINIMUM_DISPLAY_AMOUNT) {
      return `Less than ${formatCurrency({ amount: MINIMUM_DISPLAY_AMOUNT })}`
    }

    if (hasExchangeRate) {
      return formatCurrency({ amount: amountInCurrency })
    }

    return rawFormatCurrency({
      amount: amountInCurrency,
      currency: 'USD',
      boostSmallNumberPrecision: false
    })
  }, [totalRewardsFiat, exchangeRate, formatCurrency])

  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        padding: 16,
        marginTop: 4,
        marginBottom: 12,
        marginHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 16
      }}>
      <View sx={{ flex: 1, gap: 2, marginRight: 12 }}>
        <Text
          numberOfLines={1}
          sx={{ fontFamily: 'Inter-SemiBold', fontSize: 21, lineHeight: 24 }}>
          {formattedTotalRewardsFiat}
        </Text>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
            {rewards.map((reward, index) => (
              <View
                key={`logo-${reward.provider}-${reward.token}`}
                sx={{
                  marginLeft: index > 0 ? -4 : 0,
                  zIndex: rewards.length - index
                }}>
                <DefiMarketLogo marketName={reward.provider} width={18} />
              </View>
            ))}
          </View>
          <Text
            variant="body2"
            numberOfLines={1}
            sx={{ flex: 1, color: '$textSecondary' }}>
            {rewards
              .slice(0, 1)
              .map(reward => `${reward.amount.toFixed(7)} ${reward.token}`)
              .join('')}
            {rewards.length > 1 && ` +${rewards.length - 1} more`}
          </Text>
        </View>
      </View>
      <Button
        type="primary"
        size="small"
        onPress={onClaimPress}
        disabled={isClaiming}>
        {isClaiming ? <ActivityIndicator size="small" /> : 'Claim rewards'}
      </Button>
    </View>
  )
}
