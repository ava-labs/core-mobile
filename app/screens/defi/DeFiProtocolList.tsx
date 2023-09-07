import { useDeFiProtocolList } from 'hooks/defi/useDeFiProtocolList'
import React from 'react'
import { View } from 'react-native'
import DeFiService from 'services/defi/DeFiService'
import Card from 'components/Card'
import { DeFiSimpleProtocol } from 'services/defi/types'
import { PortfolioDeFiHomeLoader } from 'screens/portfolio/home/components/Loaders/PortfolioDeFiHomeLoader'
import AvaText from 'components/AvaText'
import LinkSVG from 'components/svg/LinkSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { useDeFiChainList } from 'hooks/defi/useDeFiChainList'
import AvaButton from 'components/AvaButton'
import { PortfolioScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { openURL } from 'utils/openURL'
import BigList from 'components/BigList'
import { ErrorState } from './components/ErrorState'
import { ZeroState } from './components/ZeroState'
import { ProtocolLogo } from './components/ProtocolLogo'
import { NetworkLogo } from './components/NetworkLogo'

type ScreenProps = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

export const DeFiProtocolList = () => {
  const { navigate } = useNavigation<ScreenProps>()
  const {
    theme,
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { data: chainList } = useDeFiChainList()
  const {
    data,
    isLoading,
    error,
    pullToRefresh,
    isRefreshing,
    isPaused,
    isSuccess
  } = useDeFiProtocolList()

  const memoizedData = React.useMemo(() => {
    if (!data) return []
    return DeFiService.sortSimpleProtocols(data)
  }, [data])

  const handleGoToDetail = (protocolId: string) => {
    navigate({
      name: AppNavigation.Wallet.DeFiProtocolDetails,
      params: { protocolId }
    })
  }

  const goToProtocolPage = async (siteUrl?: string) => {
    openURL(siteUrl)
  }

  const handleExploreEcosystem = () => {
    openURL('https://core.app/discover/')
  }

  if (isLoading) return <PortfolioDeFiHomeLoader />
  if (error || (isPaused && !isSuccess)) {
    return <ErrorState />
  }

  const renderItem = ({ item }: { item: DeFiSimpleProtocol }) => {
    const netUsdValue = currencyFormatter(item.netUsdValue)
    const networkLogo = chainList?.[item.chain]?.logoUrl
    const protocolId = item.id

    const renderLogo = () => {
      return (
        <View>
          <ProtocolLogo uri={item.logoUrl} />
          <NetworkLogo
            uri={networkLogo}
            style={{
              marginRight: 16,
              position: 'absolute',
              bottom: 0,
              right: 0
            }}
          />
        </View>
      )
    }

    return (
      <AvaButton.Base onPress={() => handleGoToDetail(protocolId)}>
        <Card
          key={item.id}
          style={{
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {renderLogo()}
            <AvaText.Heading5>{item.name}</AvaText.Heading5>
          </View>
          <View>
            <AvaButton.Base onPress={() => goToProtocolPage(item.siteUrl)}>
              <View style={{ alignItems: 'flex-end' }}>
                <AvaText.Body2 color={theme.neutral50}>
                  {netUsdValue}
                </AvaText.Body2>
                <Space y={6} />
                <LinkSVG color={theme.white} />
              </View>
            </AvaButton.Base>
          </View>
        </Card>
      </AvaButton.Base>
    )
  }

  return (
    <BigList
      data={memoizedData}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 16 }}
      refreshing={isRefreshing}
      onRefresh={pullToRefresh}
      estimatedItemSize={80}
      ListEmptyComponent={
        <ZeroState onExploreEcosystem={handleExploreEcosystem} />
      }
    />
  )
}
