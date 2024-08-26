import { BitcoinSendTransactionParams } from '@avalabs/bitcoin-module'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { resolve } from '@avalabs/core-utils-sdk'
import { Account } from 'store/account'
import { SendServiceEVM } from 'services/send/SendServiceEVM'
import { NFTItemData } from 'store/nft'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { isErc721 } from 'services/nft/utils'
import { SendServicePVM } from 'services/send/SendServicePVM'
import { RpcMethod } from 'store/rpc'
import { getAddressByNetwork } from 'store/account/utils'
import { SendServiceAVM } from 'services/send/SendServiceAVM'
import { transactionRequestToTransactionParams } from 'store/rpc/utils/transactionRequestToTransactionParams'
import { type NftTokenWithBalance, TokenType } from '@avalabs/vm-module-types'
import {
  getAvalancheCaip2ChainId,
  getBitcoinCaip2ChainId,
  getEvmCaip2ChainId
} from 'temp/caip2ChainIds'
import { AvalancheSendTransactionParams } from '@avalabs/avalanche-module'
import sendServiceBTC from './SendServiceBTC'
import {
  isValidSendState,
  SendParams,
  SendServiceHelper,
  SendState
} from './types'

class SendService {
  async send({
    sendState,
    network,
    account,
    currency,
    sentryTrx,
    request
  }: SendParams): Promise<string> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.send')
      .executeAsync(async () => {
        const fromAddress = getAddressByNetwork(account, network)
        if (!fromAddress) {
          throw new Error('Source address not set')
        }
        const service = this.getService(network, fromAddress)

        sendState = await service.validateStateAndCalculateFees({
          sendState,
          isMainnet: !network.isTestnet,
          fromAddress,
          currency,
          sentryTrx
        })

        if (sendState.error?.error) {
          throw new Error(sendState.error.message)
        }

        if (!isValidSendState(sendState) || !sendState.address) {
          throw new Error('Unknown error, unable to submit')
        }

        let txHash, txError

        if (network.vmName === NetworkVMType.BITCOIN) {
          const params: BitcoinSendTransactionParams = {
            from: fromAddress,
            to: sendState.address,
            amount: Number(sendState.amount),
            feeRate: Number(sendState.defaultMaxFeePerGas ?? 0)
          }

          ;[txHash, txError] = await resolve(
            request({
              method: RpcMethod.BITCOIN_SEND_TRANSACTION,
              params,
              chainId: getBitcoinCaip2ChainId(!network.isTestnet)
            })
          )
        }

        if (network.vmName === NetworkVMType.PVM) {
          const txRequest = await (
            service as SendServicePVM
          ).getTransactionRequest({
            sendState,
            isMainnet: !network.isTestnet,
            fromAddress,
            currency,
            sentryTrx,
            accountIndex: account.index
          })

          ;[txHash, txError] = await resolve(
            request({
              method: RpcMethod.AVALANCHE_SEND_TRANSACTION,
              params: txRequest as AvalancheSendTransactionParams,
              chainId: getAvalancheCaip2ChainId(network.chainId)
            })
          )
        }

        if (network.vmName === NetworkVMType.AVM) {
          const txRequest = await (
            service as SendServiceAVM
          ).getTransactionRequest({
            sendState,
            isMainnet: !network.isTestnet,
            fromAddress,
            currency,
            sentryTrx,
            accountIndex: account.index
          })

          ;[txHash, txError] = await resolve(
            request({
              method: RpcMethod.AVALANCHE_SEND_TRANSACTION,
              params: txRequest as AvalancheSendTransactionParams,
              chainId: getAvalancheCaip2ChainId(network.chainId)
            })
          )
        }

        if (network.vmName === NetworkVMType.EVM) {
          const txRequest = await (
            service as SendServiceEVM
          ).getTransactionRequest({
            sendState,
            isMainnet: !network.isTestnet,
            fromAddress,
            currency,
            sentryTrx
          })

          const txParams = transactionRequestToTransactionParams(txRequest)

          ;[txHash, txError] = await resolve(
            request({
              method: RpcMethod.ETH_SEND_TRANSACTION,
              params: [txParams],
              chainId: getEvmCaip2ChainId(network.chainId)
            })
          )
        }

        if (txError) {
          throw txError
        }

        if (!txHash || typeof txHash !== 'string') {
          throw new Error('invalid transaction hash')
        }

        return txHash
      })
  }

  // eslint-disable-next-line max-params
  async validateStateAndCalculateFees(
    sendState: SendState,
    activeNetwork: Network,
    account: Account,
    currency: string,
    nativeTokenBalance?: bigint
  ): Promise<SendState> {
    const fromAddress = getAddressByNetwork(account, activeNetwork)

    if (!fromAddress) {
      throw new Error('Source address not set')
    }
    const service = this.getService(activeNetwork, fromAddress)
    const params = {
      sendState,
      isMainnet: !activeNetwork.isTestnet,
      fromAddress,
      currency,
      accountIndex: account.index,
      nativeTokenBalance
    }
    return service.validateStateAndCalculateFees(params)
  }

  mapTokenFromNFT(nft: NFTItemData): NftTokenWithBalance {
    return {
      tokenId: nft.tokenId,
      type: isErc721(nft) ? TokenType.ERC721 : TokenType.ERC1155,
      address: nft.address,
      logoUri: nft.metadata.imageUri ?? '',
      name: nft.metadata.name ?? '',
      symbol: isErc721(nft) ? nft.symbol : '',
      //unused but included to conform to NftTokenWithBalance
      balanceInCurrency: 0,
      balanceDisplayValue: '',
      balanceCurrencyDisplayValue: '',
      priceInCurrency: 0,
      decimals: 0,
      description: '',
      marketCap: 0,
      change24: 0,
      vol24: 0,
      balance: 0n,
      logoSmall: '',
      attributes: [],
      collectionName: isErc721(nft) ? nft.name : nft.metadata.name ?? 'Unknown',
      coingeckoId: ''
    }
  }

  private getService(
    activeNetwork: Network,
    fromAddress: string
  ): SendServiceHelper {
    switch (activeNetwork?.vmName) {
      case NetworkVMType.BITCOIN:
        return sendServiceBTC
      case NetworkVMType.EVM: // we might be able to change this to be a singleton too
        return new SendServiceEVM(activeNetwork, fromAddress)
      case NetworkVMType.PVM:
        return new SendServicePVM(activeNetwork)
      case NetworkVMType.AVM:
        return new SendServiceAVM(activeNetwork)
      default:
        throw new Error('unhandled send helper')
    }
  }
}

export default new SendService()
