import { AvalancheCaip2ChainId } from '@avalabs/core-chains-sdk'
import { ProposalTypes } from '@walletconnect/types'
import { RpcMethod } from 'store/rpc/types'

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
    methods: [
      RpcMethod.AVALANCHE_BRIDGE_ASSET,
      RpcMethod.AVALANCHE_CREATE_CONTACT,
      RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY,
      RpcMethod.AVALANCHE_GET_ACCOUNTS,
      RpcMethod.AVALANCHE_GET_BRIDGE_STATE,
      RpcMethod.AVALANCHE_GET_CONTACTS,
      RpcMethod.AVALANCHE_REMOVE_CONTACT,
      RpcMethod.AVALANCHE_SELECT_ACCOUNT,
      RpcMethod.AVALANCHE_SET_DEVELOPER_MODE,
      RpcMethod.AVALANCHE_UPDATE_CONTACT,
      RpcMethod.AVALANCHE_SEND_TRANSACTION,
      RpcMethod.AVALANCHE_SIGN_TRANSACTION,
      RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE,
      RpcMethod.BITCOIN_SEND_TRANSACTION,
      RpcMethod.AVALANCHE_SIGN_MESSAGE
    ],
    events: [
      'chainChanged',
      'accountsChanged',
      'message',
      'disconnect',
      'connect'
    ]
  }
}
