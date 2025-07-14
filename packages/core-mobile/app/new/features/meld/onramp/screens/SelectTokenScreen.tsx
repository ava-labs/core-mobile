import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SelectToken } from 'features/meld/components/SelectToken'
import { useBuy } from '../../hooks/useBuy'

export const SelectTokenScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()
  const {
    navigateToBuyAmountWithAvax,
    navigateToBuyAmountWithUsdc,
    isLoadingCryptoCurrencies
  } = useBuy()

  const selectOtherToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOnrampTokenList')
  }, [navigate])

  return (
    <SelectToken
      title={`What token do\nyou want to buy?`}
      isLoadingCryptoCurrencies={isLoadingCryptoCurrencies}
      onSelectOtherToken={selectOtherToken}
      onSelectAvax={navigateToBuyAmountWithAvax}
      onSelectUsdc={navigateToBuyAmountWithUsdc}
    />
  )
}
