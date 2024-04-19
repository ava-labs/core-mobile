import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import networkService from 'services/network/NetworkService'
import walletService from 'services/wallet/WalletService'
import { Account } from 'store/account'
import { SendServiceEVM } from 'services/send/SendServiceEVM'
import { NFTItemData } from 'store/nft'
import { NftTokenWithBalance, TokenType } from 'store/balance'
import BN from 'bn.js'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { isErc721 } from 'services/nft/utils'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { SendServicePVM } from 'services/send/SendServicePVM'
import { Dispatch } from '@reduxjs/toolkit'
import {
  onRequest,
  Request,
  RpcMethod,
  SessionRequest
} from 'store/walletConnectV2'
import { SignTransactionRequest } from 'services/wallet/types'
import AccountsService from 'services/account/AccountsService'
import sendServiceBTC from './SendServiceBTC'
import { isValidSendState, SendServiceHelper, SendState } from './types'

class SendService {
  // eslint-disable-next-line max-params
  async send(
    sendState: SendState,
    activeNetwork: Network,
    account: Account,
    currency: string,
    onTxSigned?: () => void,
    sentryTrx?: Transaction,
    dispatch?: Dispatch<{ payload: Request; type: string }>
  ): Promise<string | undefined> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.send')
      .executeAsync(async () => {
        const fromAddress = AccountsService.getAddressForNetwork(
          account,
          activeNetwork
        )
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
          sentryTrx,
          accountIndex: account.index
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
          isMainnet: !activeNetwork.isTestnet,
          fromAddress,
          currency,
          sentryTrx,
          accountIndex: account.index
        })
        let txHash
        if (activeNetwork.vmName === NetworkVMType.PVM) {
          dispatch?.(
            onRequest({
              data: {
                params: {
                  request: {
                    method: RpcMethod.AVALANCHE_SEND_TRANSACTION,
                    params: txRequest
                  },
                  chainId: `eip155:${activeNetwork.chainId}`
                }
              },
              method: RpcMethod.AVALANCHE_SEND_TRANSACTION
            } as SessionRequest<string>)
          )
        } else {
          const signedTx = await walletService.sign(
            txRequest as SignTransactionRequest,
            account.index,
            activeNetwork,
            sentryTrx
          )
          onTxSigned?.()
          txHash = await networkService.sendTransaction({
            signedTx,
            network: activeNetwork,
            sentryTrx
          })
          AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
            chainId: activeNetwork.chainId,
            txHash: txHash
          })
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
    nativeTokenBalance?: BN
  ): Promise<SendState> {
    const fromAddress = AccountsService.getAddressForNetwork(
      account,
      activeNetwork
    )

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
