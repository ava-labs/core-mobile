import React from 'react'
import { ServiceProviderCategories } from 'features/meld/consts'
import { SelectMeldCurrency } from 'features/meld/components/SelectMeldCurrency'

export const SelectCurrencyScreen = (): React.JSX.Element => {
  return (
    <SelectMeldCurrency category={ServiceProviderCategories.CRYPTO_ONRAMP} />
  )
}
