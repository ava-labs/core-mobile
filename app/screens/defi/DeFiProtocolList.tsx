import { useDeFiProtocolList } from 'hooks/defi/useDeFiProtocolList'
import React from 'react'
import { FlatList, Image, Linking, View, Pressable, Alert } from 'react-native'
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
import { ErrorState } from './components/ErrorState'
import { ZeroState } from './components/ZeroState'

export const DeFiProtocolList = () => {
  const {
    theme,
    appHook: { currencyFormatter }
  } = useApplicationContext()
  const { data: chainList } = useDeFiChainList()
  const { data, isLoading, error, isPaused } = useDeFiProtocolList()

  const memoizedData = React.useMemo(() => {
    if (!data) return []
    return DeFiService.sortSimpleProtocols(data)
  }, [data])

  const handleGoToDetail = () => {
    Alert.alert('Not Implemented')
  }

  const handleExploreEcosystem = () => {
    Linking.openURL('https://core.app/discover/')
  }

  if (isLoading) return <PortfolioDeFiHomeLoader />
  if (error || isPaused) return <ErrorState />
  if (memoizedData.length === 0)
    return <ZeroState onExploreEcosystem={handleExploreEcosystem} />

  const renderItem = ({ item }: { item: DeFiSimpleProtocol }) => {
    const netUsdValue = currencyFormatter(item.netUsdValue)
    const networkLogo = chainList?.[item.chain]?.logoUrl

    const renderLogo = () => {
      return (
        <View>
          <Image
            source={{ uri: item.logoUrl }}
            style={{
              width: 40,
              height: 40,
              marginRight: 16,
              borderRadius: 20
            }}
          />
          {networkLogo && (
            <Image
              source={{ uri: networkLogo }}
              style={{
                width: 12,
                height: 12,
                marginRight: 16,
                borderRadius: 6,
                position: 'absolute',
                bottom: 0,
                right: 0
              }}
            />
          )}
        </View>
      )
    }

    return (
      <AvaButton.Base onPress={handleGoToDetail}>
        <Card
          key={item.id}
          style={{
            marginBottom: 8,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <View style={{ flexDirection: 'row' }}>
            {renderLogo()}
            <AvaText.Heading5>{item.name}</AvaText.Heading5>
          </View>
          <View>
            <Pressable onPress={handleExploreEcosystem}>
              <View style={{ alignItems: 'flex-end' }}>
                <AvaText.Body2 color={theme.neutral50}>
                  {netUsdValue}
                </AvaText.Body2>
                <Space y={6} />
                <LinkSVG color={theme.white} />
              </View>
            </Pressable>
          </View>
        </Card>
      </AvaButton.Base>
    )
  }

  return (
    <FlatList
      data={memoizedData}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 16 }}
    />
  )
}
