import { Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account/types'
import { getAddressByNetwork } from 'store/account/utils'

/**
 * Returns the subset of the globally-enabled `enabledNetworks` that
 * `account` can actually receive balance data for (i.e. the account has
 * an address for that VM type).
 *
 * This is the source of truth for "how many balance entries should this
 * account have before we consider it fully loaded?". Using the global
 * `enabledNetworks.length` would cause wallets like Keystone (no Solana)
 * to spin forever on the My wallets screen because they can never produce
 * a balance entry for every globally-enabled network. See CP-14303.
 *
 * Address presence is resolved through `getAddressByNetwork`, mirroring
 * the address-based gating `buildRequestItemsForAccounts` applies to
 * EVM, BTC, and SVM balance requests. Avalanche X/P requests are gated
 * separately (by `xpub` / xpAddresses, not `getAddressByNetwork`), so
 * X/P entries from the address-based check here can be wider than what
 * the backend is actually asked for — accounts whose `addressAVM`/
 * `addressPVM` are populated should also have either xpub or
 * xpAddresses available, but treat the mapping as a close approximation
 * rather than a strict equivalence.
 */
export function getEnabledNetworksForAccount(
  account: Account,
  enabledNetworks: Network[]
): Network[] {
  return enabledNetworks.filter(network => {
    const address = getAddressByNetwork(account, network)
    return typeof address === 'string' && address.trim() !== ''
  })
}
