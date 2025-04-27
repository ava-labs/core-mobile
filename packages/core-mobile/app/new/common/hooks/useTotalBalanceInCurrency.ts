import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useSelector } from 'react-redux'
import { selectAccountByIndex } from 'store/account'
import {
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useFormatCurrency } from './useFormatCurrency'

export const useTotalBalanceInCurrencyForAccount = (
  accountIndex: number
): string => {
  const { formatCurrency } = useFormatCurrency()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const account = useSelector(selectAccountByIndex(accountIndex))
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(account?.index ?? 0, tokenVisibility)
  )
  const balanceAccurate = useSelector(
    selectBalanceForAccountIsAccurate(account?.index ?? 0)
  )
  const currencyBalance =
    !balanceAccurate || balanceTotalInCurrency === 0
      ? '$' + UNKNOWN_AMOUNT
      : formatCurrency({ amount: balanceTotalInCurrency })

  return currencyBalance.replace(selectedCurrency, '')
}
