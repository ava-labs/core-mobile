import Big from 'big.js'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { round } from 'lodash'
import { selectAvaxPrice } from 'store/balance'

const convertNAvaxToAvaxAndCurrency = (
  value: string | undefined,
  currencyPrice: number,
  rounded: boolean
) => {
  const amountInNAvax = value ?? '0'
  const rawAmountInAvax = new Big(amountInNAvax).div(1e9).toNumber()
  const amountInAvax = rounded ? round(rawAmountInAvax, 5) : rawAmountInAvax
  const amountInCurrency = amountInAvax * currencyPrice

  return {
    amountInAvax,
    amountInCurrency
  }
}

// a hook to convert a nAvax amount to Avax and the current currency
export const useNAvaxToAvax = () => {
  const {
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()

  const avaxPrice = useSelector(selectAvaxPrice)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const nAvaxToAvax = (valueInNAvax: string | undefined, rounded = false) => {
    const { amountInAvax, amountInCurrency } = convertNAvaxToAvaxAndCurrency(
      valueInNAvax,
      avaxPrice,
      rounded
    )

    const formattedAmountInCurrency = `${tokenInCurrencyFormatter(
      amountInCurrency
    )} ${selectedCurrency}`

    return [amountInAvax, formattedAmountInCurrency]
  }

  return nAvaxToAvax
}
