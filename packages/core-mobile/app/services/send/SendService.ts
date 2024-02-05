import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import networkService from 'services/network/NetworkService'
import walletService from 'services/wallet/WalletService'
import { Account } from 'store/account'
import { SendServiceEVM } from 'services/send/SendServiceEVM'
import { NFTItemData } from 'store/nft'
import { TokenType, NftTokenWithBalance } from 'store/balance'
import BN from 'bn.js'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { isErc721 } from 'services/nft/utils'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isValidSendState, SendServiceHelper, SendState } from './types'
import sendServiceBTC from './SendServiceBTC'

class SendService {
  // eslint-disable-next-line max-params
  async send(
    sendState: SendState,
    activeNetwork: Network,
    account: Account,
    currency: string,
    onTxSigned?: () => void,
    sentryTrx?: Transaction
  ): Promise<string> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.send')
      .executeAsync(async () => {
        const fromAddress =
          activeNetwork.vmName === NetworkVMType.BITCOIN
            ? account.addressBtc
            : account.address

        const service = await this.getService(activeNetwork, fromAddress)
        sendState = await service.validateStateAndCalculateFees({
          sendState,
          isMainnet: !activeNetwork.isTestnet,
          fromAddress,
          currency,
          sentryTrx
        })

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
          sentryTrx
        })
        const signedTx = await walletService.sign(
          txRequest,
          account.index,
          activeNetwork,
          sentryTrx
        )
        onTxSigned?.()
        const txHash = await networkService.sendTransaction(
          signedTx,
          activeNetwork,
          false,
          sentryTrx
        )

        AnalyticsService.captureWithEncryption('SendRequestSucceeded', {
          chainId: activeNetwork.chainId,
          txHash: txHash
        })

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
    const fromAddress =
      activeNetwork.vmName === NetworkVMType.BITCOIN
        ? account.addressBtc
        : account.address

    const service = this.getService(activeNetwork, fromAddress)
    return service.validateStateAndCalculateFees({
      sendState,
      isMainnet: !activeNetwork.isTestnet,
      fromAddress,
      currency,
      nativeTokenBalance
    })
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
