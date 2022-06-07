import { EventEmitter } from 'events'
import { NetworkVMType } from '@avalabs/chains-sdk'
import NetworkService from 'services/network/NetworkService'
import {
  isValidSendState,
  SendEvent,
  SendServiceHelper,
  SendState
} from './models'
import SendServiceBTC from './SendServiceBTC'

class SendService {
  private eventEmitter = new EventEmitter()
  private sendServiceBTC = SendServiceBTC
  private networkService = NetworkService

  transactionUpdated(txData: { txId: string }) {
    this.eventEmitter.emit(SendEvent.TX_DETAILS, txData)
  }

  async send(
    sendState: SendState,
    isMainnet: boolean,
    fromAddress: string
  ): Promise<string> {
    const service = await this.getService()
    sendState = await service.validateStateAndCalculateFees(
      sendState,
      isMainnet,
      fromAddress
    )

    if (sendState.error?.error) {
      throw new Error(sendState.error.message)
    }

    if (!isValidSendState(sendState)) {
      throw new Error('Unknown error, unable to submit')
    }

    // todo: depends on WalletService for signing
    // const txRequest = await service.getTransactionRequest(
    //   sendState,
    //   isMainnet,
    //   fromAddress
    // )
    // const signedTx = await this.walletService.sign(txRequest)
    const txId = await this.networkService.sendTransaction('') //signedTx)
    this.transactionUpdated({ txId })
    return txId
  }

  async validateStateAndCalculateFees(
    sendState: SendState,
    isMainnet: boolean,
    fromAddress: string
  ): Promise<SendState> {
    const service = await this.getService()
    return service.validateStateAndCalculateFees(
      sendState,
      isMainnet,
      fromAddress
    )
  }

  addListener(event: SendEvent, callback: (data: unknown) => void) {
    this.eventEmitter.on(event, callback)
  }

  private async getService(): Promise<SendServiceHelper> {
    const activeNetwork = await this.networkService.activeNetwork
    switch (activeNetwork?.vmName) {
      case NetworkVMType.BITCOIN:
        return this.sendServiceBTC
      default:
        throw new Error('unhandled send helper')
    }
  }
}

export default new SendService()
