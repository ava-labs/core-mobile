import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SelectPaymentMethod } from 'features/meld/components/SelectPaymentMethod'
import { ServiceProviderCategories } from '../../consts'

export const OnrampPaymentMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()

  const handleSelectServiceProvider = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/onrampPaymentMethod/onrampServiceProvider')
  }, [navigate])

  return (
    <SelectPaymentMethod
      title="Pay with"
      category={ServiceProviderCategories.CRYPTO_ONRAMP}
      onSelectServiceProvider={handleSelectServiceProvider}
    />
  )
}
