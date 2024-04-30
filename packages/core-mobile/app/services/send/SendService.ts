import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { resolve } from '@avalabs/utils-sdk'
import { Transaction } from '@sentry/types'
import { Account } from 'store/account'
import { SendServiceEVM } from 'services/send/SendServiceEVM'
import { NFTItemData } from 'store/nft'
import { NftTokenWithBalance, TokenType } from 'store/balance'
import BN from 'bn.js'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { isErc721 } from 'services/nft/utils'
import { SendServicePVM } from 'services/send/SendServicePVM'
import { SignTransactionRequest } from 'services/wallet/types'
import { createInAppRequest, onRequest, RpcMethod } from 'store/rpc'
import {
  isAvalancheTransactionRequest,
  isAvalancheTxParams,
  isBtcTransactionRequest
} from 'services/wallet/utils'
import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction/utils'
import AnalyticsService from 'services/analytics/AnalyticsService'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { getAddressByNetwork } from 'store/account/utils'
import sendServiceBTC from './SendServiceBTC'
import {
  isValidSendState,
  SendParams,
  SendServiceHelper,
  SendState
} from './types'

class SendService {
  // TODO: remove once SendNFT is migrated
  // eslint-disable-next-line max-params
  async sendDeprecated(
    sendState: SendState,
    activeNetwork: Network,
    account: Account,
    currency: string,
    onTxSigned?: () => void,
    sentryTrx?: Transaction
  ): Promise<string | undefined> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.send')
      .executeAsync(async () => {
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
          sentryTrx
        }
        sendState = await service.validateStateAndCalculateFees(params)

        if (sendState.error?.error) {
          throw new Error(sendState.error.message)
        }

        if (!isValidSendState(sendState)) {
          throw new Error('Unknown error, unable to submit')
        }

        const txRequest = (await service.getTransactionRequest({
          sendState,
          isMainnet: !activeNetwork.isTestnet,
          fromAddress,
          currency,
          sentryTrx
        })) as SignTransactionRequest

        const signedTx = await WalletService.sign(
          txRequest,
          account.index,
          activeNetwork,
          sentryTrx
        )
        onTxSigned?.()
        const txHash = await NetworkService.sendTransaction({
          signedTx,
          network: activeNetwork,
          sentryTrx
        })
        AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
          chainId: activeNetwork.chainId,
          txHash: txHash
        })

        return txHash
      })
  }

  async send({
    sendState,
    network,
    account,
    currency,
    signAndSend,
    sentryTrx,
    dispatch
  }: SendParams): Promise<string> {
    return (
      SentryWrapper.createSpanFor(sentryTrx)
        .setContext('svc.send.send')
        // eslint-disable-next-line sonarjs/cognitive-complexity
        .executeAsync(async () => {
          const fromAddress = getAddressByNetwork(account, network)
          if (!fromAddress) {
            throw new Error('Source address not set')
          }

          const service =
            network.vmName === NetworkVMType.PVM
              ? new SendServicePVM(network)
              : this.getService(network, fromAddress)
          const params = {
            sendState,
            isMainnet: !network.isTestnet,
            fromAddress,
            currency,
            sentryTrx
          }
          sendState = await service.validateStateAndCalculateFees(params)

          if (sendState.error?.error) {
            throw new Error(sendState.error.message)
          }

          if (!isValidSendState(sendState)) {
            throw new Error('Unknown error, unable to submit')
          }

          const txRequest = await service.getTransactionRequest({
            sendState,
            isMainnet: !network.isTestnet,
            fromAddress,
            currency,
            sentryTrx
          })

          if (network.vmName === NetworkVMType.PVM) {
            const request = createInAppRequest({
              method: RpcMethod.AVALANCHE_SEND_TRANSACTION,
              params: txRequest,
              chainId: network.chainId.toString()
            })
            dispatch?.(onRequest(request))
          } else {
            if (isBtcTransactionRequest(txRequest)) {
              // TODO add logic once btc send is migrated
            } else if (isAvalancheTransactionRequest(txRequest)) {
              // TODO add logic once avalanche send is migrated
            } else if (isAvalancheTxParams(txRequest)) {
              // TODO add logic once avalanche send is migrated
            } else {
              // evm send
              const [txHash, txError] = await resolve(
                signAndSend([
                  // okay to cast here because our eth_sendTransaction will validate the payload
                  txRequest as TransactionParams
                ])
              )

              if (txError) {
                throw new Error(`Tx Error: ${txError}`)
              }

              if (!txHash) {
                throw new Error('Tx hash empty')
              }

              return txHash
            }
          }

          // TODO remove
          return ''
        })
    )
  }

  // eslint-disable-next-line max-params
  async validateStateAndCalculateFees(
    sendState: SendState,
    activeNetwork: Network,
    account: Account,
    currency: string,
    nativeTokenBalance?: BN
  ): Promise<SendState> {
    const fromAddress = getAddressByNetwork(account, activeNetwork)

    if (!fromAddress) {
      throw new Error('Source address not set')
    }
    const service =
      activeNetwork.vmName === NetworkVMType.PVM
        ? new SendServicePVM(activeNetwork)
        : this.getService(activeNetwork, fromAddress)
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
      balance: new BN(0)
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
      default:
        throw new Error('unhandled send helper')
    }
  }
}

export default new SendService()
