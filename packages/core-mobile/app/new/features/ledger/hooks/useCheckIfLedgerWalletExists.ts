import { useCallback } from 'react'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { useLedgerWalletMap } from '../store'

/**
 * Returns a function that checks whether a Ledger wallet with the given
 * device ID and derivation path type has already been imported.
 * BIP44 and LedgerLive wallets from the same device are considered distinct.
 */
export const useCheckIfLedgerWalletExists = (): ((
  deviceId: string,
  derivationPathType: LedgerDerivationPathType
) => boolean) => {
  const { ledgerWalletMap } = useLedgerWalletMap()

  return useCallback(
    (deviceId: string, derivationPathType: LedgerDerivationPathType) => {
      return Object.values(ledgerWalletMap).some(
        entry =>
          entry.device.id === deviceId &&
          entry.derivationPathType === derivationPathType
      )
    },
    [ledgerWalletMap]
  )
}
