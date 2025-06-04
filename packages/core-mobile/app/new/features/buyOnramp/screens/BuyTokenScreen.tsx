import { GroupList, GroupListItem } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { TokenLogo } from 'common/components/TokenLogo'
import { Space } from 'common/components/Space'
import {
  MELD_CURRENCY_CODES,
  SearchProviderCategories
} from 'services/meld/consts'
import { TokenSymbol } from 'store/network'
import { useOnRampToken } from '../store'
import { useSearchCryptoCurrencies } from '../hooks/useSearchCryptoCurrencies'

export const BuyTokenScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const [_, setSelectedToken] = useOnRampToken()
  const { data: cryptoCurrencies } = useSearchCryptoCurrencies({
    categories: [SearchProviderCategories.CryptoOnramp],
    serviceProviders: ['COINBASEPAY'],
    countries: ['US'],
    accountFilter: false
  })

  const avax = cryptoCurrencies?.find(
    token => token.currencyCode === MELD_CURRENCY_CODES.AVAXC
  )
  const usdc = cryptoCurrencies?.find(
    token => token.currencyCode === MELD_CURRENCY_CODES.USDC
  )

  const buyAvax = useCallback((): void => {
    avax && setSelectedToken(avax)
  }, [avax, setSelectedToken])

  const buyUsdc = useCallback((): void => {
    usdc && setSelectedToken(usdc)
  }, [usdc, setSelectedToken])

  const selectOtherToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectBuyToken')
  }, [navigate])

  const data = useMemo(() => {
    const _data: GroupListItem[] = [
      {
        title: TokenSymbol.AVAX,
        leftIcon: <TokenLogo symbol={TokenSymbol.AVAX} />,
        onPress: buyAvax
      },
      {
        title: TokenSymbol.USDC,
        leftIcon: <TokenLogo symbol={TokenSymbol.USDC} />,
        onPress: buyUsdc
      },
      {
        title: 'Select other token',
        onPress: selectOtherToken
      }
    ]

    return _data
  }, [buyAvax, buyUsdc, selectOtherToken])

  return (
    <ScrollScreen
      title={`What token do\nyou want to buy?`}
      contentContainerStyle={{ padding: 16 }}>
      <Space y={16} />
      <GroupList
        data={data}
        titleSx={{
          fontFamily: 'Inter-regular',
          fontSize: 16,
          lineHeight: 22,
          fontWeight: 500
        }}
        textContainerSx={{
          paddingVertical: 4
        }}
        separatorMarginRight={16}
      />
    </ScrollScreen>
  )
}
