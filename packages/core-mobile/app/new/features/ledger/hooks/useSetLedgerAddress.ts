import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { LedgerKeys } from 'services/ledger/types'
import { setLedgerAddresses } from 'store/account'
import { getOppositeKeys } from '../utils'

export const useSetLedgerAddress = (): {
  setLedgerAddress: ({
    walletId,
    isDeveloperMode,
    accountId,
    accountIndex,
    keys
  }: {
    walletId: string
    isDeveloperMode: boolean
    accountId: string
    accountIndex: number
    keys: LedgerKeys
  }) => Promise<void>
} => {
  const dispatch = useDispatch()

  const setLedgerAddress = useCallback(
    async ({
      walletId,
      isDeveloperMode,
      accountId,
      accountIndex,
      keys
    }: {
      walletId: string
      isDeveloperMode: boolean
      accountId: string
      accountIndex: number
      keys: LedgerKeys
    }) => {
      const oppositeKeys = await getOppositeKeys({
        accountIndex,
        isDeveloperMode
      })

      const mainnet = isDeveloperMode
        ? oppositeKeys
        : {
            addressBTC: keys.bitcoinAddress ?? '',
            addressAVM: keys.avalancheKeys?.addresses.avm || '',
            addressPVM: keys.avalancheKeys?.addresses.pvm || '',
            addressCoreEth: keys.avalancheKeys?.addresses.coreEth || ''
          }

      const testnet = isDeveloperMode
        ? {
            addressBTC: keys.bitcoinAddress ?? '',
            addressAVM: keys.avalancheKeys?.addresses.avm || '',
            addressPVM: keys.avalancheKeys?.addresses.pvm || '',
            addressCoreEth: keys.avalancheKeys?.addresses.coreEth || ''
          }
        : oppositeKeys

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
