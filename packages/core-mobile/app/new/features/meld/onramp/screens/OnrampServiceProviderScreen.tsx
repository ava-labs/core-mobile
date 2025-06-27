import React from 'react'
import { SelectServiceProvider } from 'features/meld/components/SelectServiceProvider'
import { ServiceProviderCategories } from '../../consts'

export const OnrampServiceProviderScreen = (): React.JSX.Element => {
  return (
    <SelectServiceProvider
      category={ServiceProviderCategories.CRYPTO_ONRAMP}
      description="External providers are used to process fiat-to-crypto purchases. Rates vary between providers"
    />
  )
}
