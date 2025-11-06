import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import { Account, selectActiveAccount, selectAccounts } from 'store/account'
import { selectWallets } from 'store/wallet/slice'
import { WalletDisplayData } from 'common/types'
import { NetworkVMType } from '@avalabs/vm-module-types'
import {
  IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID,
  IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME
} from '../consts'
import { useGetAccountData } from '../hooks/useGetAccountData'

export const useWalletDisplayData = (
  searchText: string
): WalletDisplayData[] => {
  const allWallets = useSelector(selectWallets)
  const activeAccount = useSelector(selectActiveAccount)
  const {
    getAccountData,
    getPrimaryPlatformAccountData,
    getImportedPlatformAccountData
  } = useGetAccountData()
  const accountCollection = useSelector(selectAccounts)

  const allAccountsArray: Account[] = useMemo(
    () => Object.values(accountCollection),
    [accountCollection]
  )

  const accountSearchResults = useMemo(() => {
    if (!searchText) {
      return allAccountsArray
    }
    return allAccountsArray.filter(account => {
      const wallet = allWallets[account.walletId]
      if (!wallet) {
        return false
      }
      const walletName = wallet.name.toLowerCase()

      const isPrivateKeyAccount = wallet.type === WalletType.PRIVATE_KEY
      const virtualWalletMatches =
        isPrivateKeyAccount &&
        IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME.toLowerCase().includes(
          searchText.toLowerCase()
        )
      const walletNameMatches =
        !isPrivateKeyAccount && walletName.includes(searchText.toLowerCase())

      return (
        virtualWalletMatches ||
        walletNameMatches ||
        account.name.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressC?.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressBTC?.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressAVM?.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressPVM?.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressSVM?.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressCoreEth?.toLowerCase().includes(searchText.toLowerCase())
      )
    })
  }, [allAccountsArray, allWallets, searchText])

  const importedWallets = useMemo(() => {
    return Object.values(allWallets).filter(
      wallet => wallet.type === WalletType.PRIVATE_KEY
    )
  }, [allWallets])

  const primaryWallets = useMemo(() => {
    return Object.values(allWallets).filter(
      wallet => wallet.type !== WalletType.PRIVATE_KEY
    )
  }, [allWallets])

  const primaryWalletsDisplayData = useMemo(() => {
    return primaryWallets.map(wallet => {
      const accountsForWallet = accountSearchResults.filter(
        account => account.walletId === wallet.id
      )

      const accountDataForWallet = accountsForWallet.map((account, index) => {
        const isActive = account.id === activeAccount?.id
        const nextAccount = accountsForWallet[index + 1]
        const hideSeparator = isActive || nextAccount?.id === activeAccount?.id

        return getAccountData({
          hideSeparator,
          isActive,
          account,
          walletName: wallet.name
        })
      })

      const platformAccountsDataForWallet = [
        NetworkVMType.PVM,
        NetworkVMType.AVM
      ].map(networkVmType =>
        getPrimaryPlatformAccountData({
          wallet,
          numberOfAddresses: accountsForWallet.length,
          networkVmType: networkVmType as NetworkVMType.AVM | NetworkVMType.PVM
        })
      )

      return {
        ...wallet,
        accounts: [...platformAccountsDataForWallet, ...accountDataForWallet]
      }
    })
  }, [
    primaryWallets,
    accountSearchResults,
    activeAccount?.id,
    getAccountData,
    getPrimaryPlatformAccountData
  ])

  const importedWalletsDisplayData = useMemo(() => {
    // Get all accounts from private key wallets
    const allPrivateKeyAccounts = importedWallets.flatMap(wallet => {
      return accountSearchResults.filter(
        account => account.walletId === wallet.id
      )
    })

    if (allPrivateKeyAccounts.length === 0) {
      return null
    }

    // Create virtual "Private Key Accounts" wallet if there are any imported wallets
    // Only add the virtual wallet if there are matching accounts (respects search)
    const privateKeyAccountData = allPrivateKeyAccounts.map(
      (account, index) => {
        const isActive = account.id === activeAccount?.id
        const nextAccount = allPrivateKeyAccounts[index + 1]
        const hideSeparator = isActive || nextAccount?.id === activeAccount?.id

        return getAccountData({
          hideSeparator,
          isActive,
          account
        })
      }
    )

    const platformAccountsDataForWallet = [
      NetworkVMType.PVM,
      NetworkVMType.AVM
    ].map(networkVmType =>
      getImportedPlatformAccountData({
        numberOfAddresses: privateKeyAccountData.length,
        networkVmType: networkVmType as NetworkVMType.AVM | NetworkVMType.PVM
      })
    )

    // Create virtual wallet for private key accounts
    return {
      id: IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID, // Virtual ID
      name: IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME,
      type: WalletType.PRIVATE_KEY,
      accounts: [...platformAccountsDataForWallet, ...privateKeyAccountData]
    }
  }, [
    importedWallets,
    accountSearchResults,
    activeAccount?.id,
    getAccountData,
    getImportedPlatformAccountData
  ])

  return useMemo(() => {
    return [...primaryWalletsDisplayData, importedWalletsDisplayData].filter(
      Boolean
    ) as WalletDisplayData[]
  }, [primaryWalletsDisplayData, importedWalletsDisplayData])
}
