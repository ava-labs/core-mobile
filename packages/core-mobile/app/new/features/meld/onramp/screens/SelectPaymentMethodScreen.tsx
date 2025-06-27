import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SelectPaymentMethod } from 'features/meld/components/SelectPaymentMethod'
import { ServiceProviderCategories } from '../../consts'

export const SelectPaymentMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()

  const handleSelectServiceProvider = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectPaymentMethod/selectServiceProvider')
  }, [navigate])

  return (
    <SelectPaymentMethod
      title="Pay with"
      category={ServiceProviderCategories.CRYPTO_ONRAMP}
      onSelectServiceProvider={handleSelectServiceProvider}
    />
  )
}
