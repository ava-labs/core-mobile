import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import React, { useCallback, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  Button,
  Icons,
  useTheme
} from '@avalabs/k2-alpine'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDeFiProtocol } from 'hooks/defi/useDeFiProtocol'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'
import { useDeFiChainList } from 'hooks/defi/useDeFiChainList'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { openURL } from 'utils/openURL'
import { mapPortfolioItems } from 'features/defi/utils/utils'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { LogoWithNetwork } from 'features/portfolio/defi/components/LogoWithNetwork'
import { DeFiPortfolioItemGroup } from 'features/portfolio/defi/components/DeFiPortfolioItemGroup'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'

const DeFiDetailScreen = (): JSX.Element => {
  const { back } = useRouter()
  const { protocolId } = useLocalSearchParams<{ protocolId: string }>()

  const { formatCurrency } = useFormatCurrency()
  const { theme } = useTheme()
  const getAmount = useExchangedAmount()

  const { data, isLoading, error, isPaused, isSuccess } =
    useDeFiProtocol(protocolId)
  const { data: chainList } = useDeFiChainList()

  const memoizedChain = useMemo(() => {
    if (!data?.chain) return undefined
    return chainList?.[data.chain]
  }, [chainList, data?.chain])

  const goToProtocolPage = useCallback(async () => {
    openURL(data?.siteUrl)
    AnalyticsService.capture('DeFiDetailLaunchButtonClicked')
  }, [data?.siteUrl])

  const calculatedTotalValueOfProtocolItems = useMemo(() => {
    if (!data?.portfolioItemList) return formatCurrency({ amount: 0 })
    const totalValue = data?.portfolioItemList.reduce(
      (total, { stats }) => total + stats.netUsdValue,
      0
    )
    return getAmount(totalValue, 'compact')
  }, [formatCurrency, data?.portfolioItemList, getAmount])

  const portfolioItemList = useMemo(() => {
    if (!data?.portfolioItemList) return []
    const portfolioItemGroups = mapPortfolioItems(data.portfolioItemList)
    return portfolioItemGroups.map(group => {
      return <DeFiPortfolioItemGroup key={group.name} group={group} />
    })
  }, [data?.portfolioItemList])

  if (isLoading) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  if (error || (isPaused && !isSuccess))
    return (
      <ErrorState
        sx={{ flex: 1 }}
        title="Data Unavailable"
        description=""
        button={{
          title: 'Back',
          onPress: back
        }}
      />
    )

  if (!data || !data.portfolioItemList || data.portfolioItemList.length === 0) {
    return (
      <ErrorState
        sx={{ flex: 1 }}
        title="No data has been found."
        description="Go back to DeFi portfolio."
      />
    )
  }

  return (
    <BlurredBarsContentLayout>
      <ScrollView sx={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View sx={{ gap: 10 }}>
          <LogoWithNetwork size="medium" item={data} chain={memoizedChain} />
          <View>
            <Text variant="heading2" sx={{ color: '$textSecondary' }}>
              {data.name}
            </Text>
            <Text variant="heading2">
              {calculatedTotalValueOfProtocolItems}
            </Text>
          </View>
        </View>
        {portfolioItemList}
      </ScrollView>
      <LinearGradientBottomWrapper>
        <Button
          style={{ marginHorizontal: 16, marginBottom: 52 }}
          size="large"
          type="primary"
          rightIcon={
            <Icons.Custom.Outbound
              style={{ marginLeft: 8 }}
              color={theme.colors.$surfacePrimary}
            />
          }
          onPress={goToProtocolPage}>
          {`See details in ${data?.name ?? protocolId}`}
        </Button>
      </LinearGradientBottomWrapper>
    </BlurredBarsContentLayout>
  )
}

export default DeFiDetailScreen
