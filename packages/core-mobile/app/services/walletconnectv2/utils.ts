import { BlockchainNamespace } from '@avalabs/core-chains-sdk'
import { isXChainId, isPChainId } from 'utils/caip2ChainIds'
import { Account } from 'store/account'

// generate full address with caip2 chain ID based on the blockchain namespace
// an example result 'eip155:1:0x241b0073b66bfc19FCB54308861f604F5Eb8f51b'
export const getAddressWithCaip2ChainId = ({
  account,
  blockchainNamespace,
  caip2ChainId
}: {
  account: Account
  blockchainNamespace: string
  caip2ChainId: string
}): string | undefined => {
  let address: string | undefined

  // Resolve the per-chain address first, then guard against an empty/missing
  // value before building the CAIP-10 account string. Non-primary Keystone
  // accounts have empty X/P (AVM/PVM) addresses (CP-14606); without this guard
  // we would advertise a malformed "avax:<chain>:" account (trailing colon, no
  // address) to the dApp.
  let resolvedAddress: string | undefined

  if (blockchainNamespace === BlockchainNamespace.AVAX) {
    resolvedAddress = isXChainId(caip2ChainId)
      ? account.addressAVM
      : isPChainId(caip2ChainId)
      ? account.addressPVM
      : undefined
  } else if (blockchainNamespace === BlockchainNamespace.BIP122) {
    resolvedAddress = account.addressBTC
  } else if (blockchainNamespace === BlockchainNamespace.EIP155) {
    resolvedAddress = account.addressC
  }

  if (resolvedAddress && resolvedAddress.trim().length > 0) {
    address = `${caip2ChainId}:${resolvedAddress}`
  }

  return address
}

export const updateAccountListInNamespace = ({
  account,
  accounts
}: {
  account: string
  accounts: string[]
}): void => {
  if (!accounts.includes(account)) {
    accounts.push(account)
  }
}

export const updateChainListInNamespace = ({
  chains,
  caip2ChainId
}: {
  chains: string[] | undefined
  caip2ChainId: string
}): void => {
  const existingChains = chains || []
  if (!existingChains.includes(caip2ChainId)) {
    existingChains.push(caip2ChainId)
  }
}
