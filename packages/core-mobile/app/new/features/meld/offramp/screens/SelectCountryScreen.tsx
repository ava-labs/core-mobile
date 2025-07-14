import React from 'react'
import { ServiceProviderCategories } from 'features/meld/consts'
import { SelectCountry } from 'features/meld/components/SelectCountry'

export const SelectCountryScreen = (): React.JSX.Element => {
  return <SelectCountry category={ServiceProviderCategories.CRYPTO_OFFRAMP} />
}
