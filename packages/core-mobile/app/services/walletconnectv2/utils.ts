import { SessionTypes } from '@walletconnect/types'
import { EVM_IDENTIFIER } from 'store/rpc/types'

// prefix eip155 namespace to a chainId
// '1' -> 'eip155:1'
export const addNamespaceToChain = (chainId: number): string => {
  return `${EVM_IDENTIFIER}:${chainId}`
}

// prefix eip155 namespace and chainId to an address
// '0x241b0073b66bfc19FCB54308861f604F5Eb8f51b' -> 'eip155:1:0x241b0073b66bfc19FCB54308861f604F5Eb8f51b'
export const addNamespaceToAddress = (
  address: string,
  chainId: number
): string => {
  return `${EVM_IDENTIFIER}:${chainId}:${address}`
}

// check if chain id is already included in the session's chains
export const chainAlreadyInSession = (
  session: SessionTypes.Struct,
  chainId: number
): boolean => {
  return Boolean(
    session.namespaces?.[EVM_IDENTIFIER]?.chains?.includes(
      addNamespaceToChain(chainId)
    )
  )
}

// check if address is already included in the session's accounts
export const addressAlreadyInSession = (
  session: SessionTypes.Struct,
  account: string
): boolean | undefined => {
  return session.namespaces?.[EVM_IDENTIFIER]?.accounts?.includes(account)
}
