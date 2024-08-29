import { BlockchainNamespace } from '@avalabs/core-chains-sdk'
import {
  getAvalancheCaip2ChainId,
  getBitcoinCaip2ChainIdByChainId,
  isXChainId,
  isPChainId
} from 'temp/caip2ChainIds'
import { CorePrimaryAccount } from '@avalabs/types'

// prefix correct namespace to a chainId
// '1' -> 'eip155:1'
export const addNamespaceToChain = (chainId: number): string => {
  const caip2ChainId =
    getAvalancheCaip2ChainId(chainId) ||
    getBitcoinCaip2ChainIdByChainId(chainId)

  if (caip2ChainId) {
    return caip2ChainId
  }

  return `${BlockchainNamespace.EIP155}:${chainId}`
}

// generate full address with caip2 chain ID based on the blockchain namespace
// an example result 'eip155:1:0x241b0073b66bfc19FCB54308861f604F5Eb8f51b'
export const getAddressWithCaip2ChainId = ({
  account,
  blockchainNamespace,
  caip2ChainId
}: {
  account: CorePrimaryAccount
  blockchainNamespace: string
  caip2ChainId: string
}): string | undefined => {
  let address: string | undefined

  if (blockchainNamespace === BlockchainNamespace.AVAX) {
    address = isXChainId(caip2ChainId)
      ? `${caip2ChainId}:${account.addressAVM}`
      : isPChainId(caip2ChainId)
      ? `${caip2ChainId}:${account.addressPVM}`
      : undefined
  } else if (blockchainNamespace === BlockchainNamespace.BIP122) {
    address = `${caip2ChainId}:${account.addressBTC}`
  } else if (blockchainNamespace === BlockchainNamespace.EIP155) {
    address = `${caip2ChainId}:${account.addressC}`
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
