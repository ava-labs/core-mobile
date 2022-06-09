//TODO: delete this file

// @ts-nocheck These are not used anymore because we don't support P & X chains
import {
  AccountsHdCache,
  setHdCache,
  useAccountsContext,
  useWalletContext
} from '@avalabs/wallet-react-components'
import { useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MnemonicWallet } from '@avalabs/avalanche-wallet-sdk'

/**
 * These are not used anymore because we don't support P & X chains
 * so there's no need for HD key derivations and caching.
 * However, in future we might need it so i'll let it marinate.
 */
export function useWalletCache() {
  const walletContext = useWalletContext()
  const accountsContext = useAccountsContext()

  // set cache if there it one
  useEffect(() => {
    AsyncStorage.getItem('HD_CACHE').then(value => {
      if (value) {
        const cache: AccountsHdCache = JSON.parse(value)
        setHdCache(cache)
      }
    })
  }, [])

  // save cache
  useEffect(() => {
    // persist HDCache JSON
    // check if empty
    if (accountsContext?.hdCache) {
      AsyncStorage.setItem('HD_CACHE', JSON.stringify(accountsContext.hdCache))
    }
  }, [accountsContext.hdCache])

  async function resetHDIndices() {
    return (walletContext?.wallet as MnemonicWallet)?.resetHdIndices()
  }

  return {
    resetHDIndices
  }
}
