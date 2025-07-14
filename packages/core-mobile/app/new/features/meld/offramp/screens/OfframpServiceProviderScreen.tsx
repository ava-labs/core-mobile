import React from 'react'
import { SelectServiceProvider } from 'features/meld/components/SelectServiceProvider'
import { ServiceProviderCategories } from '../../consts'

export const OfframpServiceProviderScreen = (): React.JSX.Element => {
  return (
    <SelectServiceProvider
      category={ServiceProviderCategories.CRYPTO_OFFRAMP}
      description="External providers are used to process crypto-to-fiat withdrawals. Rates vary between providers."
    />
  )
}
