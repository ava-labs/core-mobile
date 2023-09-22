import { SessionTypes } from '@walletconnect/types'
import { EVM_IDENTIFIER } from 'consts/walletConnect'

export const addNamespaceToChain = (chainId: number) => {
  return `${EVM_IDENTIFIER}:${chainId}`
}

export const addNamespaceToAddress = (address: string, chainId: number) => {
  return `${EVM_IDENTIFIER}:${chainId}:${address}`
}

export const chainAlreadyInSession = (
  session: SessionTypes.Struct,
  chainId: number
) => {
  return session.namespaces?.[EVM_IDENTIFIER]?.chains?.includes(
    addNamespaceToChain(chainId)
  )
}

export const addressAlreadyInSession = (
  session: SessionTypes.Struct,
  account: string
) => {
  return session.namespaces?.[EVM_IDENTIFIER]?.accounts?.includes(account)
}
