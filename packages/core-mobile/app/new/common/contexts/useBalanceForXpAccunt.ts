import { useCallback, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchXpBalancesForWallet,
  QueryStatus,
  selectBalanceTotalInCurrencyForXpNetwork,
  selectIsXpBalanceLoadedForWallet,
  selectXpBalanceStatus
} from 'store/balance'
import { XpNetworkVMType } from 'store/network'
import { selectWalletById } from 'store/wallet/slice'

export const useBalanceFoXpAccount = (
  walletId: string,
  networkType: XpNetworkVMType
): {
  isBalanceLoaded: boolean
  fetchBalance: () => void
  isFetchingBalance: boolean
  balance: number
} => {
  const dispatch = useDispatch()
  const wallet = useSelector(selectWalletById(walletId))
  const xpBalanceStatus = useSelector(selectXpBalanceStatus)
  const isBalanceLoading = xpBalanceStatus !== QueryStatus.IDLE
  const [isFetchingBalance, setIsFetchingBalance] = useState(true)
  const accountBalance = useSelector(
    selectBalanceTotalInCurrencyForXpNetwork(walletId, networkType)
  )

  const isBalanceLoaded = useSelector(
    selectIsXpBalanceLoadedForWallet(walletId, networkType)
  )

  const fetchBalance = useCallback(() => {
    if (wallet) {
      dispatch(fetchXpBalancesForWallet({ wallet }))
      setIsFetchingBalance(true)
    }
  }, [wallet, dispatch])

  useEffect(() => {
    if (!isBalanceLoading && isFetchingBalance) {
      setIsFetchingBalance(false)
    }
  }, [isFetchingBalance, isBalanceLoading, setIsFetchingBalance])

  return {
    balance: accountBalance,
    fetchBalance,
    isFetchingBalance,
    isBalanceLoaded
  }
}
