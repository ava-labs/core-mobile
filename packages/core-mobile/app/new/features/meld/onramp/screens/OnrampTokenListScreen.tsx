import React from 'react'
import { useRouter } from 'expo-router'
import { TokenList } from 'features/meld/components/TokenList'
import { useMeldToken } from 'features/meld/store'
import { useSearchCryptoCurrencies } from '../../hooks/useSearchCryptoCurrencies'
import { ServiceProviderCategories } from '../../consts'
import { useBuy } from '../../hooks/useBuy'

export const OnrampTokenListScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const { navigateToBuyAmountWithToken } = useBuy()
  const [selectedToken] = useMeldToken()

  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
    })

  return (
    <TokenList
      category={ServiceProviderCategories.CRYPTO_ONRAMP}
      onPress={token => {
        canGoBack() && back()
        navigateToBuyAmountWithToken(token)
      }}
      selectedToken={selectedToken}
      cryptoCurrencies={cryptoCurrencies}
      isLoadingCryptoCurrencies={isLoadingCryptoCurrencies}
    />
  )
}
