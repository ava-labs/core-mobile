import { AvalancheCaip2ChainId } from '@avalabs/core-chains-sdk'
import { ProposalTypes } from '@walletconnect/types'
import { CORE_NONEVM_METHODS } from 'store/rpc/types'

export const NONEVM_OPTIONAL_NAMESPACES: ProposalTypes.OptionalNamespaces = {
  avax: {
    chains: [
      AvalancheCaip2ChainId.C,
      AvalancheCaip2ChainId.C_TESTNET,
      AvalancheCaip2ChainId.P,
      AvalancheCaip2ChainId.P_TESTNET,
      AvalancheCaip2ChainId.X,
      AvalancheCaip2ChainId.X_TESTNET
    ],
    methods: CORE_NONEVM_METHODS,
    events: [
      'chainChanged',
      'accountsChanged',
      'message',
      'disconnect',
      'connect'
    ]
  }
}
