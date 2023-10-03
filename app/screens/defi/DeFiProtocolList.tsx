import { useDeFiProtocolList } from 'hooks/defi/useDeFiProtocolList'
import React, { FC } from 'react'
import { View } from 'react-native'
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
import { useExchangedAmount } from 'hooks/defi/useExchangedAmount'
import { ErrorState } from './components/ErrorState'
import { ZeroState } from './components/ZeroState'
import { ProtocolLogo } from './components/ProtocolLogo'
import { NetworkLogo } from './components/NetworkLogo'

type ScreenProps = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

export const DeFiProtocolList: FC = () => {
  const { navigate } = useNavigation<ScreenProps>()

  const { theme } = useApplicationContext()
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
    return data.sort(
      ({ netUsdValue: valueA }, { netUsdValue: valueB }) => valueB - valueA
    )
  }, [data])

  const getAmount = useExchangedAmount()

  const handleGoToDetail = (protocolId: string): void => {
    navigate({
      name: AppNavigation.Wallet.DeFiProtocolDetails,
      params: { protocolId }
    })
  }

  const goToProtocolPage = (siteUrl?: string): void => {
    openURL(siteUrl)
  }

  const handleExploreEcosystem = (): void => {
    openURL('https://core.app/discover/')
  }

  if (isLoading) return <PortfolioDeFiHomeLoader />
  if (error || (isPaused && !isSuccess)) {
    return <ErrorState />
  }

  const renderItem = ({
    item
  }: {
    item: DeFiSimpleProtocol
  }): React.ReactElement => {
    const netUsdValue = getAmount(item.netUsdValue, 'compact')
    const networkLogo = chainList?.[item.chain]?.logoUrl
    const protocolId = item.id

    const renderLogo = (): React.ReactElement => {
      return (
        <View style={{ marginRight: 16 }}>
          <ProtocolLogo uri={item.logoUrl} />
          <NetworkLogo
            uri={networkLogo}
            size={16}
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              borderColor: theme.colorBg2,
              borderWidth: 2
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
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {renderLogo()}
            <View style={{ flex: 1, marginRight: 8 }}>
              <AvaText.Heading5 numberOfLines={1} ellipsizeMode="tail">
                {item.name}
              </AvaText.Heading5>
            </View>
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
        <ZeroState
          onExploreEcosystem={handleExploreEcosystem}
          bodyText="Discover top dApps on Avalanche now."
          styles={{ marginTop: 96 }}
        />
      }
    />
  )
}
