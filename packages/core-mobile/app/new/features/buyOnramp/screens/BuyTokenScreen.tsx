import { GroupList, GroupListItem } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { TokenLogo } from 'common/components/TokenLogo'
import { Space } from 'common/components/Space'
import {
  MELD_CURRENCY_CODES,
  ServiceProviderCategories
} from 'services/meld/consts'
import { TokenSymbol } from 'store/network'
import { LoadingState } from 'common/components/LoadingState'
import {
  CryptoCurrency,
  useSearchCryptoCurrencies
} from '../hooks/useSearchCryptoCurrencies'
import { useBuy } from '../hooks/useBuy'

export const BuyTokenScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const { navigateToBuy } = useBuy()
  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [ServiceProviderCategories.CryptoOnramp]
    })

  const avax = cryptoCurrencies?.find(
    token => token.currencyCode === MELD_CURRENCY_CODES.AVAXC
  )
  const usdc = cryptoCurrencies?.find(
    token => token.currencyCode === MELD_CURRENCY_CODES.USDC
  )

  const handleBuy = useCallback(
    (cryptoCurrency: CryptoCurrency): void => {
      navigateToBuy({ cryptoCurrency })
    },
    [navigateToBuy]
  )

  const selectOtherToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectBuyToken')
  }, [navigate])

  const data = useMemo(() => {
    const _data: GroupListItem[] = []
    if (avax) {
      _data.push({
        title: TokenSymbol.AVAX,
        leftIcon: <TokenLogo symbol={TokenSymbol.AVAX} />,
        onPress: () => handleBuy(avax)
      })
    }

    if (usdc) {
      _data.push({
        title: TokenSymbol.USDC,
        leftIcon: <TokenLogo symbol={TokenSymbol.USDC} />,
        onPress: () => handleBuy(usdc)
      })
    }

    _data.push({
      title: 'Select other token',
      onPress: selectOtherToken
    })

    return _data
  }, [avax, handleBuy, selectOtherToken, usdc])

  if (isLoadingCryptoCurrencies) {
    return <LoadingState sx={{ flex: 1 }} />
  }

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
