import React from 'react'
import { useRouter } from 'expo-router'
import { TokenList } from 'features/meld/components/TokenList'
import { useWithdraw } from 'features/meld/hooks/useWithdraw'
import { useMeldToken } from 'features/meld/store'
import { useSearchCryptoCurrencies } from '../../hooks/useSearchCryptoCurrencies'
import { ServiceProviderCategories } from '../../consts'

export const OfframpTokenListScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const { navigateToWithdraw } = useWithdraw()
  const [selectedToken] = useMeldToken()

  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_OFFRAMP]
    })

  return (
    <TokenList
      category={ServiceProviderCategories.CRYPTO_OFFRAMP}
      onPress={token => {
        canGoBack() && back()
        navigateToWithdraw({ token: token.tokenWithBalance })
      }}
      selectedToken={selectedToken}
      cryptoCurrencies={cryptoCurrencies}
      isLoadingCryptoCurrencies={isLoadingCryptoCurrencies}
    />
  )
}
