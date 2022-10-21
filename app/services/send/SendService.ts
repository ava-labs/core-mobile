import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import networkService from 'services/network/NetworkService'
import walletService from 'services/wallet/WalletService'
import { Account } from 'store/account'
import { SendServiceEVM } from 'services/send/SendServiceEVM'
import { NFTItemData } from 'store/nft'
import { TokenType, TokenWithBalanceERC721 } from 'store/balance'
import BN from 'bn.js'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { isValidSendState, SendServiceHelper, SendState } from './types'
import sendServiceBTC from './SendServiceBTC'

class SendService {
  async send(
    sendState: SendState,
    activeNetwork: Network,
    account: Account,
    currency: string,
    onTxSigned?: () => void,
    sentryTrx?: Transaction
  ): Promise<string> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext({ op: 'SendService.send' })
      .executeAsync(async () => {
        const fromAddress =
          activeNetwork.vmName === NetworkVMType.BITCOIN
            ? account.addressBtc
            : account.address

        const service = await this.getService(activeNetwork, fromAddress)
        sendState = await service.validateStateAndCalculateFees(
          sendState,
          !activeNetwork.isTestnet,
          fromAddress,
          currency,
          sentryTrx
        )

        if (sendState.error?.error) {
          throw new Error(sendState.error.message)
        }

        if (!isValidSendState(sendState)) {
          throw new Error('Unknown error, unable to submit')
        }

        const txRequest = await service.getTransactionRequest(
          sendState,
          !activeNetwork.isTestnet,
          fromAddress,
          currency,
          sentryTrx
        )
        const signedTx = await walletService.sign(
          txRequest,
          account.index,
          activeNetwork,
          sentryTrx
        )
        onTxSigned?.()
        return await networkService.sendTransaction(
          signedTx,
          activeNetwork,
          false,
          sentryTrx
        )
      })
  }

  async validateStateAndCalculateFees(
    sendState: SendState,
    activeNetwork: Network,
    account: Account,
    currency: string
  ): Promise<SendState> {
    const fromAddress =
      activeNetwork.vmName === NetworkVMType.BITCOIN
        ? account.addressBtc
        : account.address

    const service = this.getService(activeNetwork, fromAddress)
    return service.validateStateAndCalculateFees(
      sendState,
      !activeNetwork.isTestnet,
      fromAddress,
      currency
    )
  }

  mapTokenFromNFT(nft: NFTItemData): TokenWithBalanceERC721 {
    return {
      tokenId: nft.tokenId,
      type: TokenType.ERC721,
      address: nft.address,
      logoUri: nft.image,
      name: nft.name,
      symbol: nft.symbol,
      //unused but included to conform to TokenWithBalanceERC721
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
