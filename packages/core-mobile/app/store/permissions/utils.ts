import type { Account } from 'store/account/types'
import { Address } from './types'

/**
 * Collect every non-empty per-VM address a Core account holds, de-duped.
 *
 * Used at the listener boundary to map a removed account → the address keys its
 * dApp grants are stored under, so removal can revoke all of them across VMs.
 * (AVM/PVM/CoreEth addresses can coincide, hence the dedupe.) Keeping this here
 * — not in the slice — preserves the slice's address-only, VM-agnostic shape.
 */
export const collectAccountAddresses = (account: Account): Address[] => {
  const addresses = [
    account.addressC,
    account.addressSVM,
    account.addressBTC,
    account.addressAVM,
    account.addressPVM,
    account.addressCoreEth
  ].filter((address): address is string => Boolean(address))
  return Array.from(new Set(addresses))
}
