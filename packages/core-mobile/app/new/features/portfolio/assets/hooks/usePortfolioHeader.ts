import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { selectTokenVisibility } from 'store/portfolio'
import {
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount,
  selectBalanceTotalInCurrencyForXpNetwork,
  selectIsBalanceLoadedForAccount,
  selectIsLoadingAccountBalances,
  selectIsLoadingXpBalances,
  selectIsRefetchingAccountBalances,
  selectIsRefetchingXpBalances,
  selectIsXpBalanceLoadedForWallet,
  selectTokensWithBalanceForAccount,
  selectXpBalanceForAccountIsAccurate
} from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useMemo } from 'react'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { RootState } from 'store/types'
import { PriceChangeStatus } from '@avalabs/k2-alpine'
import { selectActiveWallet } from 'store/wallet/slice'
import { NetworkVMType } from '@avalabs/vm-module-types'

export const usePortfolioHeader = (): {
  balanceTotalInCurrency: number
  formattedBalance: string
  balanceAccurate: boolean
  isLoading: boolean
  formattedPriceChange?: string
  indicatorStatus: PriceChangeStatus
  formattedPercent?: string
  totalPriceChanged: number
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const { getMarketTokenBySymbol } = useWatchlist()
  const tokens = useFocusedSelector((state: RootState) =>
    selectTokensWithBalanceForAccount(state, activeAccount?.id ?? '')
  )
  const activeWallet = useFocusedSelector(selectActiveWallet)
  const activeAccount = useFocusedSelector(selectActiveAccount)
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)

  const isPlatformAccount = useMemo(() => {
    return (
      activeAccount?.id === NetworkVMType.AVM ||
      activeAccount?.id === NetworkVMType.PVM
    )
  }, [activeAccount])

  const balanceTotalInCurrencyForAccount = useFocusedSelector(
    selectBalanceTotalInCurrencyForAccount(
      activeAccount?.id ?? '',
      tokenVisibility
    )
  )

  const balanceTotalInCurrencyForXpNetwork = useFocusedSelector(
    selectBalanceTotalInCurrencyForXpNetwork(
      activeWallet?.id ?? '',
      activeAccount?.id === NetworkVMType.AVM
        ? NetworkVMType.AVM
        : NetworkVMType.PVM
    )
  )

  const accountBalanceAccurate = useFocusedSelector(
    selectBalanceForAccountIsAccurate(activeAccount?.id ?? '')
  )

  const xpBalanceAccurate = useFocusedSelector(
    selectXpBalanceForAccountIsAccurate(
      activeWallet?.id ?? '',
      activeAccount?.id === NetworkVMType.AVM
        ? NetworkVMType.AVM
        : NetworkVMType.PVM
    )
  )

  const balanceTotalInCurrency = isPlatformAccount
    ? balanceTotalInCurrencyForXpNetwork
    : balanceTotalInCurrencyForAccount

  const balanceAccurate = isPlatformAccount
    ? xpBalanceAccurate
    : accountBalanceAccurate

  const isAccountBalanceLoading = useFocusedSelector(
    selectIsLoadingAccountBalances
  )
  const isXpBalanceLoading = useFocusedSelector(selectIsLoadingXpBalances)
  const isRefetchingAccountBalance = useFocusedSelector(
    selectIsRefetchingAccountBalances
  )
  const isRefetchingXpBalance = useFocusedSelector(selectIsRefetchingXpBalances)
  const isAccountBalanceLoaded = useFocusedSelector(
    selectIsBalanceLoadedForAccount(activeAccount?.id ?? '')
  )
  const isXpBalanceLoaded = useFocusedSelector(
    selectIsXpBalanceLoadedForWallet(
      activeWallet?.id ?? '',
      activeAccount?.id === NetworkVMType.AVM
        ? NetworkVMType.AVM
        : NetworkVMType.PVM
    )
  )
  const isAccountLoading = useMemo(
    () =>
      isAccountBalanceLoading ||
      isRefetchingAccountBalance ||
      !isAccountBalanceLoaded,
    [
      isAccountBalanceLoading,
      isRefetchingAccountBalance,
      isAccountBalanceLoaded
    ]
  )

  const isXpAccountLoading = useMemo(
    () => isXpBalanceLoading || isRefetchingXpBalance || !isXpBalanceLoaded,
    [isXpBalanceLoading, isRefetchingXpBalance, isXpBalanceLoaded]
  )

  const isLoading = isPlatformAccount ? isXpAccountLoading : isAccountLoading

  const { formatCurrency } = useFormatCurrency()
  const formattedBalance = useMemo(() => {
    // CP-10570: Balances should never show $0.00
    return !balanceAccurate || balanceTotalInCurrency === 0
      ? UNKNOWN_AMOUNT
      : formatCurrency({
          amount: balanceTotalInCurrency,
          withoutCurrencySuffix: true
        })
  }, [balanceAccurate, balanceTotalInCurrency, formatCurrency])

  const totalPriceChanged = useMemo(
    () =>
      tokens.reduce((acc, token) => {
        const marketToken = getMarketTokenBySymbol(token.symbol)
        const percentChange = marketToken?.priceChangePercentage24h ?? 0
        const priceChange = token.balanceInCurrency
          ? (token.balanceInCurrency * percentChange) / 100
          : 0
        return acc + priceChange
      }, 0),
    [getMarketTokenBySymbol, tokens]
  )

  const formattedPriceChange =
    totalPriceChanged !== 0
      ? formatCurrency({ amount: Math.abs(totalPriceChanged) })
      : undefined

  const indicatorStatus =
    totalPriceChanged > 0
      ? PriceChangeStatus.Up
      : totalPriceChanged < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral

  const totalPriceChangedInPercent = useMemo(() => {
    return (totalPriceChanged / balanceTotalInCurrency) * 100
  }, [balanceTotalInCurrency, totalPriceChanged])

  const formattedPercent = useMemo(
    () =>
      !isFinite(totalPriceChangedInPercent) || totalPriceChangedInPercent === 0
        ? undefined
        : totalPriceChangedInPercent.toFixed(2) + '%',
    [totalPriceChangedInPercent]
  )

  return {
    balanceTotalInCurrency,
    formattedBalance,
    balanceAccurate,
    isLoading,
    formattedPriceChange,
    indicatorStatus,
    formattedPercent,
    totalPriceChanged
  }
}
