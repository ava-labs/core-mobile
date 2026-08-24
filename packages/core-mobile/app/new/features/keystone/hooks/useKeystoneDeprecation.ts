import { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import { selectIsKeystoneBlocked } from 'store/posthog'
import { selectActiveWallet } from 'store/wallet/slice'
import { RootState } from 'store/types'

/**
 * Deliberately does NOT subscribe to the active wallet. This runs inside
 * `WalletHeaderRow`, once per row in the wallet list, and `selectActiveWallet`
 * is unmemoized — subscribing here would re-render every row on any
 * active-wallet change, defeating that component's `arePropsEqual` comparator
 * (a `useSelector` inside a memoized component bypasses it entirely).
 * Callers that need the active wallet use `useIsActiveWalletKeystoneDeprecated`.
 */
export const useKeystoneDeprecation = (): {
  isKeystoneDeprecated: boolean
  shouldWarnForWalletType: (walletType: WalletType) => boolean
  openDeprecationInfo: () => void
} => {
  const { navigate } = useRouter()
  const isKeystoneDeprecated = useSelector(selectIsKeystoneBlocked)

  const shouldWarnForWalletType = useCallback(
    (walletType: WalletType): boolean =>
      isKeystoneDeprecated && walletType === WalletType.KEYSTONE,
    [isKeystoneDeprecated]
  )

  const openDeprecationInfo = useCallback((): void => {
    navigate({ pathname: '/keystoneDeprecation' })
  }, [navigate])

  return {
    isKeystoneDeprecated,
    shouldWarnForWalletType,
    openDeprecationInfo
  }
}

// Selects the type alone rather than the wallet object so the subscription
// compares a primitive; `selectActiveWallet` returns a fresh reference whenever
// the active wallet record changes.
const selectActiveWalletType = (state: RootState): WalletType | undefined =>
  selectActiveWallet(state)?.type

export const useIsActiveWalletKeystoneDeprecated = (): boolean => {
  const isKeystoneDeprecated = useSelector(selectIsKeystoneBlocked)
  const activeWalletType = useSelector(selectActiveWalletType)

  return isKeystoneDeprecated && activeWalletType === WalletType.KEYSTONE
}
