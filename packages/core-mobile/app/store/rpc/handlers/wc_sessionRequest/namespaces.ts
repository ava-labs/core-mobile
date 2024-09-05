import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId,
  BlockchainNamespace
} from '@avalabs/core-chains-sdk'
import { ProposalTypes } from '@walletconnect/types'
import { CORE_AVAX_METHODS, CORE_BTC_METHODS } from 'store/rpc/types'

export const COMMON_EVENTS = [
  'chainChanged',
  'accountsChanged',
  'message',
  'disconnect',
  'connect'
]

export const NON_EVM_OPTIONAL_NAMESPACES: ProposalTypes.OptionalNamespaces = {
  [BlockchainNamespace.AVAX]: {
    chains: [
      AvalancheCaip2ChainId.C,
      AvalancheCaip2ChainId.P,
      AvalancheCaip2ChainId.X
    ],
    methods: CORE_AVAX_METHODS,
    events: COMMON_EVENTS
  },
  [BlockchainNamespace.BIP122]: {
    chains: [BitcoinCaip2ChainId.MAINNET],
    methods: CORE_BTC_METHODS,
    events: COMMON_EVENTS
  }
}

export const NON_EVM_TEST_NET_OPTIONAL_NAMESPACES: ProposalTypes.OptionalNamespaces =
  {
    [BlockchainNamespace.AVAX]: {
      chains: [
        AvalancheCaip2ChainId.C_TESTNET,
        AvalancheCaip2ChainId.P_TESTNET,
        AvalancheCaip2ChainId.X_TESTNET
      ],
      methods: CORE_AVAX_METHODS,
      events: COMMON_EVENTS
    },
    [BlockchainNamespace.BIP122]: {
      chains: [BitcoinCaip2ChainId.TESTNET],
      methods: CORE_BTC_METHODS,
      events: COMMON_EVENTS
    }
  }

export const getNonEvmOptionalNamespaces = (
  isTestnet?: boolean
): ProposalTypes.OptionalNamespaces => {
  return isTestnet
    ? NON_EVM_TEST_NET_OPTIONAL_NAMESPACES
    : NON_EVM_OPTIONAL_NAMESPACES
}
