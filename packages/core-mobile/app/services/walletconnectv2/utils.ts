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

/**
 * Pull the address out of a CAIP-10 account string
 * (`<namespace>:<reference>:<address>`). Returns undefined for anything that
 * isn't shaped like one.
 */
const getAddressFromCaip10 = (caip10Account: string): string | undefined => {
  const address = caip10Account.split(':')[2]
  return address && address.length > 0 ? address : undefined
}

// EVM addresses are case-insensitive (EIP-55 checksums are a display concern),
// so they are compared lowercased. Every other namespace we support uses
// case-sensitive encodings (base58 for SVM, bech32/base58 for AVAX and BIP122),
// where lowercasing would make distinct addresses collide.
const normalizeAddressForComparison = (address: string): string =>
  address.startsWith('0x') ? address.toLowerCase() : address

/**
 * Whether `caip10Account` names an address the session is already approved for
 * within this namespace.
 */
export const isAddressApprovedInNamespace = ({
  caip10Account,
  accounts
}: {
  caip10Account: string
  accounts: string[]
}): boolean => {
  const address = getAddressFromCaip10(caip10Account)

  if (!address) return false

  const normalized = normalizeAddressForComparison(address)

  return accounts.some(approved => {
    const approvedAddress = getAddressFromCaip10(approved)
    return (
      approvedAddress !== undefined &&
      normalizeAddressForComparison(approvedAddress) === normalized
    )
  })
}

/**
 * Add `account` to a namespace's account list, but only when the session was
 * already approved for that address.
 */
export const updateAccountListInNamespace = ({
  account,
  accounts
}: {
  account: string
  accounts: string[]
}): boolean => {
  if (!isAddressApprovedInNamespace({ caip10Account: account, accounts })) {
    return false
  }

  if (!accounts.includes(account)) {
    accounts.push(account)
  }

  return true
}

/**
 * Every chain the dApp declared for a namespace when it proposed the session —
 * approved (`namespaces`) plus merely requested (`requiredNamespaces` /
 * `optionalNamespaces`).
 */
const getDeclaredChains = (
  namespaces: Record<string, { chains?: string[] }> | undefined,
  blockchainNamespace: string
): string[] => {
  if (!namespaces) return []

  return Object.entries(namespaces).flatMap(([key, value]) => {
    if (key === blockchainNamespace) return value?.chains ?? []
    // A chain-scoped key IS the chain id (`eip155:1`).
    if (key.startsWith(`${blockchainNamespace}:`)) {
      return [key, ...(value?.chains ?? [])]
    }
    return []
  })
}

/**
 * Whether the session may be extended to `caip2ChainId`.
 */
export const isChainDeclaredInSession = ({
  session,
  blockchainNamespace,
  caip2ChainId
}: {
  session: {
    namespaces: Record<string, { chains?: string[] }>
    requiredNamespaces?: Record<string, { chains?: string[] }>
    optionalNamespaces?: Record<string, { chains?: string[] }>
  }
  blockchainNamespace: string
  caip2ChainId: string
}): boolean =>
  [
    session.namespaces,
    session.requiredNamespaces,
    session.optionalNamespaces
  ].some(namespaces =>
    getDeclaredChains(namespaces, blockchainNamespace).includes(caip2ChainId)
  )

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
