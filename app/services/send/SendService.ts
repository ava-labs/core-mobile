import { WalletService } from 'services/wallet/WalletService'
import { NetworkService } from 'services/network/NetworkService'
import { SendServiceHelper, SendState } from 'services/send/types'
import { SendServiceEVM } from 'services/send/SendServiceEVM'
import { SendServiceBTC } from 'services/send/SendServiceBTC'
import { Account } from 'dto/Account'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'

export class SendService {
  constructor(
    private walletService: WalletService,
    private networkService: NetworkService
  ) {}

  async send(
    sendState: SendState,
    activeNetwork: Network,
    account: Account
  ): Promise<string> {
    const fromAddress =
      activeNetwork.vmName === NetworkVMType.BITCOIN
        ? account.addressBtc
        : account.address

    const sendService = this.pickSendService(activeNetwork, fromAddress)
    sendState = await sendService.validateStateAndCalculateFees(sendState)

    if (sendState.error?.error) {
      throw new Error(sendState.error.message)
    }

    if (!sendState.canSubmit) {
      throw new Error('Unknown error, unable to submit')
    }

    const txRequest = await sendService.getTransactionRequest(sendState)
    const signedTx = await this.walletService.sign(
      txRequest,
      account.index,
      activeNetwork
    )
    return await this.networkService.sendTransaction(signedTx, activeNetwork)
  }

  private pickSendService(
    activeNetwork: Network,
    fromAddress: string
  ): SendServiceHelper {
    switch (activeNetwork?.vmName) {
      case NetworkVMType.BITCOIN:
        return new SendServiceBTC() //TODO
      case NetworkVMType.EVM:
        return new SendServiceEVM(
          this.networkService,
          activeNetwork,
          fromAddress
        )
      default:
        throw new Error('unhandled send helper')
    }
  }
}
