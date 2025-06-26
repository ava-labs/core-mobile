import React from 'react'
import { useRouter } from 'expo-router'
import { TokenList } from 'features/meld/screens/TokenList'
import { useWithdraw } from 'features/meld/hooks/useWithdraw'
import { useSearchCryptoCurrencies } from '../../hooks/useSearchCryptoCurrencies'
import { ServiceProviderCategories } from '../../consts'
import { useOffRampToken } from '../store'

export const OfframpTokenListScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const { navigateToWithdraw } = useWithdraw()
  const [selectedToken] = useOffRampToken()

  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_OFFRAMP]
    })

  return (
    <TokenList
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
