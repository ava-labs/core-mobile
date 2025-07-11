import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { SelectPaymentMethod } from 'features/meld/components/SelectPaymentMethod'
import { ServiceProviderCategories } from '../../consts'

export const OfframpPaymentMethodScreen = (): React.JSX.Element => {
  const { navigate } = useRouter()

  const handleSelectServiceProvider = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/offrampPaymentMethod/offrampServiceProvider')
  }, [navigate])

  return (
    <SelectPaymentMethod
      title="Withdraw to"
      category={ServiceProviderCategories.CRYPTO_OFFRAMP}
      onSelectServiceProvider={handleSelectServiceProvider}
    />
  )
}
