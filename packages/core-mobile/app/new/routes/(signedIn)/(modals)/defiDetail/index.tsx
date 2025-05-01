import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { mapPortfolioItems } from 'features/defi/utils/utils'
import { DeFiPortfolioItemGroup } from 'features/portfolio/defi/components/DeFiPortfolioItemGroup'
import { LogoWithNetwork } from 'features/portfolio/defi/components/LogoWithNetwork'
import { useDeFiChainList } from 'hooks/defi/useDeFiChainList'
import { useDeFiProtocol } from 'hooks/defi/useDeFiProtocol'
import { useExchangedAmount } from 'new/common/hooks/useExchangedAmount'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import React, { useCallback, useMemo } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { openURL } from 'utils/openURL'

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

  const renderFooter = useCallback(() => {
    return (
      <Button
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
    )
  }, [data?.name, goToProtocolPage, protocolId, theme.colors.$surfacePrimary])

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
    <ScrollScreen
      navigationTitle={data.name}
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ gap: 10 }}>
        <LogoWithNetwork size="medium" item={data} chain={memoizedChain} />
        <View>
          <Text variant="heading2" sx={{ color: '$textSecondary' }}>
            {data.name}
          </Text>
          <Text variant="heading2">{calculatedTotalValueOfProtocolItems}</Text>
        </View>
      </View>

      {portfolioItemList}
    </ScrollScreen>
  )
}

export default DeFiDetailScreen
