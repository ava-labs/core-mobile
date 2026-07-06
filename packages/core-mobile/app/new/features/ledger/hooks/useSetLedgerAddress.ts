import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { LedgerKeys, LedgerKeysByNetwork } from 'services/ledger/types'
import { setLedgerAddresses } from 'store/account'

export const useSetLedgerAddress = (): {
  setLedgerAddress: ({
    walletId,
    accountId,
    accountIndex,
    keys
  }: {
    walletId: string
    accountId: string
    accountIndex: number
    keys: LedgerKeysByNetwork
  }) => Promise<void>
  setLedgerAddressesForMultipleAccounts: (
    entries: Array<{
      walletId: string
      accountId: string
      accountIndex: number
      mainnetKeys: LedgerKeys | undefined
      testnetKeys: LedgerKeys | undefined
    }>
  ) => Promise<void>
} => {
  const dispatch = useDispatch()

  const setLedgerAddress = useCallback(
    async ({
      walletId,
      accountId,
      accountIndex,
      keys
    }: {
      walletId: string
      accountId: string
      accountIndex: number
      keys: LedgerKeysByNetwork
    }) => {
      const mainnet = {
        addressBTC: keys.mainnet.avalancheKeys?.addresses.btc ?? '',
        addressAVM: keys.mainnet.avalancheKeys?.addresses.avm || '',
        addressPVM: keys.mainnet.avalancheKeys?.addresses.pvm || '',
        addressCoreEth: keys.mainnet.avalancheKeys?.addresses.coreEth || ''
      }

      const testnet = {
        addressBTC: keys.testnet.avalancheKeys?.addresses.btc ?? '',
        addressAVM: keys.testnet.avalancheKeys?.addresses.avm || '',
        addressPVM: keys.testnet.avalancheKeys?.addresses.pvm || '',
        addressCoreEth: keys.testnet.avalancheKeys?.addresses.coreEth || ''
      }

      dispatch(
        setLedgerAddresses({
          [accountId]: {
            mainnet,
            testnet,
            walletId,
            index: accountIndex,
            id: accountId
          }
        })
      )
    },
    [dispatch]
  )

  const setLedgerAddressesForMultipleAccounts = useCallback(
    async (
      entries: Array<{
        walletId: string
        accountId: string
        accountIndex: number
        mainnetKeys: LedgerKeys | undefined
        testnetKeys: LedgerKeys | undefined
      }>
    ) => {
      const ledgerAddressMap: Record<
        string,
        {
          mainnet: {
            addressBTC: string
            addressAVM: string
            addressPVM: string
            addressCoreEth: string
          }
          testnet: {
            addressBTC: string
            addressAVM: string
            addressPVM: string
            addressCoreEth: string
          }
          walletId: string
          index: number
          id: string
        }
      > = {}

      entries.forEach(
        ({ walletId, accountId, accountIndex, mainnetKeys, testnetKeys }) => {
          ledgerAddressMap[accountId] = {
            mainnet: {
              addressBTC: mainnetKeys?.avalancheKeys?.addresses.btc ?? '',
              addressAVM: mainnetKeys?.avalancheKeys?.addresses.avm ?? '',
              addressPVM: mainnetKeys?.avalancheKeys?.addresses.pvm ?? '',
              addressCoreEth:
                mainnetKeys?.avalancheKeys?.addresses.coreEth ?? ''
            },
            testnet: {
              addressBTC: testnetKeys?.avalancheKeys?.addresses.btc ?? '',
              addressAVM: testnetKeys?.avalancheKeys?.addresses.avm ?? '',
              addressPVM: testnetKeys?.avalancheKeys?.addresses.pvm ?? '',
              addressCoreEth:
                testnetKeys?.avalancheKeys?.addresses.coreEth ?? ''
            },
            walletId,
            index: accountIndex,
            id: accountId
          }
        }
      )

      dispatch(setLedgerAddresses(ledgerAddressMap))
    },
    [dispatch]
  )

  return { setLedgerAddress, setLedgerAddressesForMultipleAccounts }
}
