import {
  Button,
  Card,
  Image,
  ScrollView,
  Separator,
  Text,
  View
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { useLocalSearchParams } from 'expo-router'
import { useDeposits } from 'hooks/earn/useDeposits'
import React, { useCallback, useMemo } from 'react'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { DeFiRowItem } from 'features/portfolio/defi/components/DeFiRowItem'
import { BalanceText } from 'common/components/BalanceText'
import { useExchangedAmount } from 'common/hooks/useExchangedAmount'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DefiMarketAssetLogo } from '../components/DefiMarketAssetLogo'

export function DepositDetailScreen(): JSX.Element {
  const { marketId } = useLocalSearchParams<{ marketId: string }>()
  const { deposits } = useDeposits()
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
          <Text variant="heading2" sx={{ color: '$textPrimary' }}>
            {amountInCurrency}
          </Text>
        </View>
      </View>
    )
  }, [amountInCurrency, deposit])

  const renderContent = useCallback(() => {
    if (!deposit) return <LoadingState sx={{ flex: 1 }} />

    return (
      <View sx={{ marginTop: 46 }}>
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
              <Image
                source={{ uri: deposit.asset.iconUrl }}
                style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
              />
              <Text
                variant="body1"
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ color: '$textSecondary', flexShrink: 1 }}>
                {deposit.asset.symbol}
              </Text>
            </View>
            <BalanceText variant="body1" sx={{ color: '$textSecondary' }}>
              {amountInCurrency}
            </BalanceText>
          </DeFiRowItem>
        </Card>
      </View>
    )
  }, [amountInCurrency, deposit])

  const handleWithdraw = useCallback(() => {
    // TODO: Implement withdraw
  }, [])

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
        {renderContent()}
      </ScrollView>
      {renderFooter()}
    </BlurredBarsContentLayout>
  )
}

const IMAGE_SIZE = 24
