import React from 'react'
import { useRouter } from 'expo-router'
import { TokenList } from 'features/meld/screens/TokenList'
import { useOnrampToken } from '../store'
import { useSearchCryptoCurrencies } from '../../hooks/useSearchCryptoCurrencies'
import { ServiceProviderCategories } from '../../consts'
import { useBuy } from '../../hooks/useBuy'

export const OnrampTokenListScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const { navigateToBuy } = useBuy()
  const [selectedToken] = useOnrampToken()

  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
    })

  return (
    <TokenList
      onPress={token => {
        canGoBack() && back()
        navigateToBuy({ token: token.tokenWithBalance })
      }}
      selectedToken={selectedToken}
      cryptoCurrencies={cryptoCurrencies}
      isLoadingCryptoCurrencies={isLoadingCryptoCurrencies}
    />
  )
}
