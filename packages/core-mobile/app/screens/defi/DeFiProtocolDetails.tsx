import { useRoute } from '@react-navigation/native'
import AvaButton from 'components/AvaButton'
import Spinner from 'components/animation/Spinner'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useDeFiProtocol } from 'hooks/defi/useDeFiProtocol'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import React, { useCallback, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import LinkSVG from 'components/svg/LinkSVG'
import { Space } from 'components/Space'
import Card from 'components/Card'
import { useDeFiChainList } from 'hooks/defi/useDeFiChainList'
import { openURL } from 'utils/openURL'
import { ScrollView } from 'react-native-gesture-handler'
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'
import Separator from 'components/Separator'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { ProtocolDetailsErrorState } from './components/ProtocolDetailsErrorState'
import { mapPortfolioItems } from './utils'
import { DeFiPortfolioItemGroup } from './components/DeFiPortfolioItemGroup'
import { ZeroState } from './components/ZeroState'
import { DeFiPortfolioHeader } from './components/DeFiPortfolioHeader'

type ScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.DeFiProtocolDetails
>

export const DeFiProtocolDetails = (): JSX.Element => {
  const {
    theme,
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const getAmount = useExchangedAmount()

  const protocolId = useRoute<ScreenProps['route']>().params.protocolId
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
    if (!data?.portfolioItemList) return currencyFormatter(0)
    const totalValue = data?.portfolioItemList.reduce(
      (total, { stats }) => total + stats.netUsdValue,
      0
    )
    return getAmount(totalValue, 'compact')
  }, [currencyFormatter, data?.portfolioItemList, getAmount])

  const portfolioItemList = useMemo(() => {
    if (!data?.portfolioItemList) return []
    const portfolioItemGroups = mapPortfolioItems(data.portfolioItemList)
    return portfolioItemGroups.map(group => {
      return <DeFiPortfolioItemGroup key={group.name} group={group} />
    })
  }, [data?.portfolioItemList])

  const renderCardContent = (): JSX.Element => {
    if (!data?.portfolioItemList || data.portfolioItemList.length === 0) {
      return (
        <>
          <Separator style={{ marginTop: 16 }} />
          <ZeroState
            bodyText="No data has been found. Go back to 
          DeFi portfolio."
            styles={{ marginVertical: 48 }}
          />
        </>
      )
    }
    return <ScrollView>{portfolioItemList}</ScrollView>
  }

  if (isLoading) {
    return (
      <View style={styles.spinnerContainer}>
        <Spinner size={77} />
      </View>
    )
  }
  if (error || (isPaused && !isSuccess)) return <ProtocolDetailsErrorState />
  if (!data) {
    return (
      <Card style={{ margin: 16 }}>
        <ZeroState
          bodyText="No data has been found. Go back to 
    DeFi portfolio."
          styles={{ paddingVertical: 48 }}
        />
      </Card>
    )
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <DeFiPortfolioHeader
          logoUrl={data.logoUrl}
          name={data.name}
          chainLogoUrl={memoizedChain?.logoUrl}
          chainName={memoizedChain?.name}
          goToProtocolPage={goToProtocolPage}
          totalValueOfProtocolItems={calculatedTotalValueOfProtocolItems}
        />
        {renderCardContent()}
      </Card>
      <View style={{ marginBottom: 41 }}>
        <AvaButton.PrimaryLarge onPress={goToProtocolPage}>
          <LinkSVG color={theme.logoColor} />
          <Space x={8} />
          {`Go to ${data?.name ?? protocolId}`}
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  },
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    flexShrink: 1,
    marginTop: 16,
    marginBottom: 24,
    padding: 16
  }
})
