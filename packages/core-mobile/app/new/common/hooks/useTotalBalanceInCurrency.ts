import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useSelector } from 'react-redux'
import {
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useFormatCurrency } from './useFormatCurrency'

export const useTotalBalanceInCurrencyForAccount = (
  accountId: string
): string => {
  const { formatCurrency } = useFormatCurrency()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(accountId, tokenVisibility)
  )
  const balanceAccurate = useSelector(
    selectBalanceForAccountIsAccurate(accountId)
  )
  const currencyBalance =
    !balanceAccurate || balanceTotalInCurrency === 0
      ? '$' + UNKNOWN_AMOUNT
      : formatCurrency({ amount: balanceTotalInCurrency })

  return currencyBalance.replace(selectedCurrency, '')
}
