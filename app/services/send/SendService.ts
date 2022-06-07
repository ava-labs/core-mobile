import { EventEmitter } from 'events'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import networkService from 'services/network/NetworkService'
import walletService from 'services/wallet/WalletService'
import { Account } from 'dto/Account'
import { SendServiceEVM } from 'services/send/SendServiceEVM'
import {
  isValidSendState,
  SendEvent,
  SendServiceHelper,
  SendState
} from './models'
import sendServiceBTC from './SendServiceBTC'

class SendService {
  // do we want to track transactions?
  private eventEmitter = new EventEmitter()

  // do we want to track transactions?
  transactionUpdated(txData: { txId: string }) {
    this.eventEmitter.emit(SendEvent.TX_DETAILS, txData)
  }

  // do we want to track transactions?
  addListener(event: SendEvent, callback: (data: unknown) => void) {
    this.eventEmitter.on(event, callback)
  }

  async send(
    sendState: SendState,
    activeNetwork: Network,
    account: Account
  ): Promise<string> {
    const fromAddress =
      activeNetwork.vmName === NetworkVMType.BITCOIN
        ? account.addressBtc
        : account.address

    const service = await this.getService(activeNetwork, fromAddress)
    sendState = await service.validateStateAndCalculateFees(
      sendState,
      !activeNetwork.isTestnet,
      fromAddress
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
      fromAddress
    )
    const signedTx = await walletService.sign(
      txRequest,
      account.index,
      activeNetwork
    )
    const txId = await networkService.sendTransaction(signedTx, activeNetwork)
    this.transactionUpdated({ txId })
    return txId
  }

  async validateStateAndCalculateFees(
    sendState: SendState,
    activeNetwork: Network,
    account: Account
  ): Promise<SendState> {
    const fromAddress =
      activeNetwork.vmName === NetworkVMType.BITCOIN
        ? account.addressBtc
        : account.address

    const service = await this.getService(activeNetwork, fromAddress)
    return service.validateStateAndCalculateFees(
      sendState,
      !activeNetwork.isTestnet,
      fromAddress
    )
  }

  private async getService(
    activeNetwork: Network,
    fromAddress: string
  ): Promise<SendServiceHelper> {
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
