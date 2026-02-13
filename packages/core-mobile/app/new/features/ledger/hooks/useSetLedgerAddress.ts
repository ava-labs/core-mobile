import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { LedgerKeysByNetwork } from 'services/ledger/types'
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
        addressBTC: keys.mainnet.bitcoinAddress ?? '',
        addressAVM: keys.mainnet.avalancheKeys?.addresses.avm || '',
        addressPVM: keys.mainnet.avalancheKeys?.addresses.pvm || '',
        addressCoreEth: keys.mainnet.avalancheKeys?.addresses.coreEth || ''
      }

      const testnet = {
        addressBTC: keys.testnet.bitcoinAddress ?? '',
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

  return { setLedgerAddress }
}
