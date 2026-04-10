import { useCallback } from 'react'
import { useLedgerWalletMap } from '../store'

/**
 * Returns a function that checks whether a Ledger wallet with the given
 * device ID has already been imported.
 */
export const useCheckIfLedgerWalletExists = (): ((
  deviceId: string
) => boolean) => {
  const { ledgerWalletMap } = useLedgerWalletMap()

  return useCallback(
    (deviceId: string) => {
      return Object.values(ledgerWalletMap).some(
        entry => entry.device.id === deviceId
      )
    },
    [ledgerWalletMap]
  )
}
