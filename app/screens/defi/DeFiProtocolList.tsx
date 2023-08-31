import { useDeFiProtocolList } from 'hooks/useDeFi/useDeFiProtocolList'
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
import { ErrorState } from './components/ErrorState'
import { ZeroState } from './components/ZeroState'

export const DeFiProtocolList = () => {
  const {
    theme,
    appHook: { currencyFormatter }
  } = useApplicationContext()

  const { data, isLoading, error } = useDeFiProtocolList(
    '0x9026a229b535ecf0162dfe48fdeb3c75f7b2a7ae'
  )

  const memoizedData = React.useMemo(() => {
    if (!data) return undefined
    return DeFiService.sortSimpleProtocols(data)
  }, [data])

  const handleGoToDetail = () => {
    Alert.alert('Not Implemented')
  }

  const handleExporeEcosystem = () => {
    Linking.openURL('https://core.app/discover/')
  }

  if (isLoading) return <PortfolioDeFiHomeLoader />
  if (error) return <ErrorState />
  if (data === undefined)
    return <ZeroState onExporeEcosystem={handleExporeEcosystem} />

  const renderItem = ({ item }: { item: DeFiSimpleProtocol }) => {
    const netUsdValue = currencyFormatter(item.netUsdValue)

    return (
      <Pressable onPress={handleGoToDetail}>
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
            <Image
              source={{ uri: item.logoUrl }}
              style={{ width: 40, height: 40, marginRight: 16 }}
            />
            <AvaText.Heading5>{item.name}</AvaText.Heading5>
          </View>
          <View>
            <Pressable onPress={handleExporeEcosystem}>
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
      </Pressable>
    )
  }

  return (
    <FlatList
      data={memoizedData}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, marginTop: 16 }}
    />
  )
}
