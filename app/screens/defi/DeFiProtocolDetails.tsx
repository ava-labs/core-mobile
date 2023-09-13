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
import AvaText from 'components/AvaText'
import Separator from 'components/Separator'
import { useDeFiChainList } from 'hooks/defi/useDeFiChainList'
import { openURL } from 'utils/openURL'
import { ScrollView } from 'react-native-gesture-handler'
import { ProtocolDetailsErrorState } from './components/ProtocolDetailsErrorState'
import { ProtocolLogo } from './components/ProtocolLogo'
import { NetworkLogo } from './components/NetworkLogo'
import { mapPortfolioItems } from './utils'
import { DeFiPortfolioItemGroup } from './components/DeFiPortfolioItemGroup'
import { ZeroState } from './components/ZeroState'

type ScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.DeFiProtocolDetails
>

export const DeFiProtocolDetails = () => {
  const {
    theme,
    appHook: { currencyFormatter }
  } = useApplicationContext()
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
  }, [data?.siteUrl])

  const calculateTotalValueOfProtocolItems = useCallback(() => {
    if (!data?.portfolioItemList) return currencyFormatter(0)
    const totalValue = data?.portfolioItemList.reduce(
      (total, { stats }) => total + stats.netUsdValue,
      0
    )
    return currencyFormatter(totalValue)
  }, [currencyFormatter, data?.portfolioItemList])

  const renderPortfolioItemList = useMemo(() => {
    if (!data?.portfolioItemList) return []
    const portfolioItemGroups = mapPortfolioItems(data.portfolioItemList)
    return portfolioItemGroups.map(group => {
      return <DeFiPortfolioItemGroup key={group.name} group={group} />
    })
  }, [data?.portfolioItemList])

  const renderCardHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ProtocolLogo size={48} uri={data?.logoUrl} />
          <View style={{}}>
            <AvaText.Heading5>{data?.name ?? ''}</AvaText.Heading5>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center'
              }}>
              <NetworkLogo
                uri={memoizedChain?.logoUrl}
                style={{
                  marginRight: 6
                }}
              />
              <AvaText.Body1 color={theme.neutral400}>
                {memoizedChain?.name ?? ''}
              </AvaText.Body1>
            </View>
          </View>
        </View>
        <AvaButton.Base onPress={goToProtocolPage}>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Body2 color={theme.neutral50}>
              {calculateTotalValueOfProtocolItems()}
            </AvaText.Body2>
            <Space y={6} />
            <LinkSVG color={theme.white} />
          </View>
        </AvaButton.Base>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.spinnerContainer}>
        <Spinner size={77} />
      </View>
    )
  }
  if (error || (isPaused && !isSuccess)) return <ProtocolDetailsErrorState />
  if (!data || !data?.portfolioItemList || data.portfolioItemList.length === 0)
    return <ZeroState />

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        {renderCardHeader()}
        <Separator style={{ marginTop: 16 }} />
        <ScrollView>{renderPortfolioItemList}</ScrollView>
      </Card>
      <AvaButton.PrimaryLarge onPress={goToProtocolPage}>
        <LinkSVG color={theme.logoColor} />
        <Space x={8} />
        {`Go to ${data?.name ?? protocolId}`}
      </AvaButton.PrimaryLarge>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 41,
    justifyContent: 'space-between'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  spinnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    marginTop: 16,
    marginBottom: 24,
    padding: 16
  }
})
