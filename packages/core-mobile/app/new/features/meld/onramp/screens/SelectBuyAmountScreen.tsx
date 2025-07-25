import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { ServiceProviderCategories } from 'features/meld/consts'
import { SelectAmount } from 'features/meld/components/SelectAmount'

export const SelectBuyAmountScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()

  const handleSelectToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOnrampTokenList')
  }, [navigate])

  const handleSelectPaymentMethod = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOnrampPaymentMethod')
  }, [navigate])

  return (
    <SelectAmount
      title={`How much do you want to buy?`}
      navigationTitle={`Enter buy amount`}
      category={ServiceProviderCategories.CRYPTO_ONRAMP}
      onSelectToken={handleSelectToken}
      onSelectPaymentMethod={handleSelectPaymentMethod}
    />
  )
}
