import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { ServiceProviderCategories } from 'features/meld/consts'
import { SelectAmount } from 'features/meld/components/SelectAmount'

export const SelectWithdrawAmountScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()

  const handleSelectToken = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOfframpTokenList')
  }, [navigate])

  const handleSelectPaymentMethod = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOfframpPaymentMethod')
  }, [navigate])

  return (
    <SelectAmount
      title={`How much do you\nwant to withdraw?`}
      navigationTitle={`Enter withdraw amount`}
      category={ServiceProviderCategories.CRYPTO_OFFRAMP}
      onSelectToken={handleSelectToken}
      onSelectPaymentMethod={handleSelectPaymentMethod}
    />
  )
}
