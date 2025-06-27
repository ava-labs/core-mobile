import React from 'react'
import { SelectServiceProvider } from 'features/meld/components/SelectServiceProvider'
import { ServiceProviderCategories } from '../../consts'

export const SelectServiceProviderScreen = (): React.JSX.Element => {
  return (
    <SelectServiceProvider category={ServiceProviderCategories.CRYPTO_ONRAMP} />
  )
}
