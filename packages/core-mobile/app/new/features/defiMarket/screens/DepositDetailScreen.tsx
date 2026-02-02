import {
  Button,
  Card,
  PrivacyModeAlert,
  ScrollView,
  Separator,
  Text,
  View
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDeposits } from 'hooks/earn/useDeposits'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { DeFiRowItem } from 'features/portfolio/defi/components/DeFiRowItem'
import { BalanceText } from 'common/components/BalanceText'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useExchangedAmount } from 'common/hooks/useExchangedAmount'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { DefiMarketAssetLogo } from '../components/DefiMarketAssetLogo'
import { DefiAssetLogo } from '../components/DefiAssetLogo'

export function DepositDetailScreen(): JSX.Element {
  const { marketId } = useLocalSearchParams<{ marketId: string }>()
  const { navigate } = useRouter()
  const { deposits } = useDeposits()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const deposit = useMemo(() => {
    return deposits.find(item => item.uniqueMarketId === marketId)
  }, [deposits, marketId])
  const getAmount = useExchangedAmount()
  const { bottom } = useSafeAreaInsets()

  const amountInCurrency = useMemo(() => {
    if (!deposit) return undefined

    return getAmount(
      deposit.asset.mintTokenBalance.balanceValue.value.toNumber(),
      'compact'
    )
  }, [deposit, getAmount])

  const handleWithdraw = useCallback(() => {
    if (!deposit) return

    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/withdraw/selectAmount',
      params: { marketId: deposit.uniqueMarketId }
    })
  }, [navigate, deposit])

  const renderHeader = useCallback(() => {
    if (!deposit) return null

    return (
      <View>
        <DefiMarketAssetLogo
          market={deposit}
          logoWidth={42}
          networkLogoWidth={18}
        />
        <View
          sx={{
            marginTop: 8,
            gap: 2
          }}>
          <Text variant="heading2" sx={{ color: '$textSecondary' }}>
            {deposit.asset.symbol} on {deposit.marketName}
          </Text>
          {isPrivacyModeEnabled ? (
            <>
              <HiddenBalanceText variant="heading2" />
              <PrivacyModeAlert />
            </>
          ) : (
            <Text variant="heading2" sx={{ color: '$textPrimary' }}>
              {amountInCurrency}
            </Text>
          )}
        </View>
      </View>
    )
  }, [amountInCurrency, deposit, isPrivacyModeEnabled])

  const renderBanner = useCallback(() => {
    if (!deposit) return null

    const data = [
      {
        value: `${deposit.supplyApyPercent.toFixed(2)}%`,
        label: 'Current APY'
      },
      {
        value: deposit.historicalApyPercent
          ? `${deposit.historicalApyPercent.toFixed(2)}%`
          : '--',
        label: '30-day APY'
      },
      {
        value: deposit.totalDeposits
          ? formatNumber(deposit.totalDeposits.toNumber())
          : '--',
        label: 'Deposits'
      }
    ]

    return (
      <View
        sx={{
          marginTop: 25,
          padding: 16,
          backgroundColor: '$surfaceSecondary',
          borderRadius: 18
        }}>
        <View
          sx={{
            flexDirection: 'row',
            gap: 12
          }}>
          {data.map((item, index) => (
            <View key={index} sx={{ flex: index === 2 ? 0.8 : 0.5 }}>
              <Text variant="heading5" sx={{ color: '$textPrimary' }}>
                {item.value}
              </Text>
              <Text variant="caption" sx={{ color: '$textSecondary' }}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    )
  }, [deposit])

  const renderContent = useCallback(() => {
    if (!deposit) return <LoadingState sx={{ flex: 1 }} />

    return (
      <View sx={{ marginTop: 21 }}>
        <Text variant="heading3" sx={{ marginBottom: 10 }}>
          Lending
        </Text>
        <Card
          sx={{
            alignItems: 'stretch',
            padding: 0
          }}>
          <DeFiRowItem>
            <Text variant="body1">{'Supplied'}</Text>
          </DeFiRowItem>
          <Separator sx={{ marginHorizontal: 16 }} />
          <DeFiRowItem key={deposit.asset.symbol}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12
              }}>
              <DefiAssetLogo asset={deposit.asset} width={IMAGE_SIZE} />
              <Text
                variant="body1"
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ color: '$textSecondary', flexShrink: 1 }}>
                {deposit.asset.symbol}
              </Text>
            </View>
            {isPrivacyModeEnabled ? (
              <HiddenBalanceText
                variant="body1"
                sx={{ color: '$textSecondary' }}
              />
            ) : (
              <BalanceText variant="body1" sx={{ color: '$textSecondary' }}>
                {amountInCurrency}
              </BalanceText>
            )}
          </DeFiRowItem>
        </Card>
      </View>
    )
  }, [amountInCurrency, deposit, isPrivacyModeEnabled])

  const renderFooter = useCallback(() => {
    if (!deposit) return null

    return (
      <View sx={{ marginBottom: bottom, padding: 16 }}>
        <Button type="primary" size="large" onPress={handleWithdraw}>
          Withdraw
        </Button>
      </View>
    )
  }, [deposit, handleWithdraw, bottom])

  return (
    <BlurredBarsContentLayout>
      <ScrollView contentContainerSx={{ padding: 16 }}>
        {renderHeader()}
        {renderBanner()}
        {renderContent()}
      </ScrollView>
      {renderFooter()}
    </BlurredBarsContentLayout>
  )
}

const IMAGE_SIZE = 24
