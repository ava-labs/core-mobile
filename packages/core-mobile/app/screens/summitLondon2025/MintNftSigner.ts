import { RpcMethod } from '@avalabs/vm-module-types'
import {
  Signer,
  Provider,
  TransactionRequest,
  TransactionResponse,
  TypedDataDomain,
  TypedDataField,
  AbstractSigner
} from 'ethers'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'

export class MintNftSigner extends AbstractSigner<Provider> {
  constructor(
    provider: Provider,
    private request: Request,
    private fromAddress: string
  ) {
    super(provider)
  }

  async sendTransaction(tx: TransactionRequest): Promise<TransactionResponse> {
    const network = await this.provider.getNetwork()
    if (!network) {
      throw new Error('Network not found')
    }

    const txHash = await this.request({
      method: RpcMethod.ETH_SEND_TRANSACTION,
      params: [
        {
          to: tx.to,
          from: this.fromAddress,
          data: tx.data
        }
      ],
      chainId: getEvmCaip2ChainId(Number(network.chainId))
    })

    const receipt = await this.provider.waitForTransaction(txHash)

    if (receipt) {
      return receipt.getTransaction()
    }

    throw new Error('Minting NFT failed')
  }

  getAddress(): Promise<string> {
    return notImplemented('getAddress')
  }
  signTransaction(_: TransactionRequest): Promise<string> {
    return notImplemented('signTransaction')
  }
  signMessage(_: string | Uint8Array): Promise<string> {
    return notImplemented('signMessage')
  }
  signTypedData(
    _: TypedDataDomain,
    __: Record<string, Array<TypedDataField>>,
    ___: Record<string, unknown>
  ): Promise<string> {
    return notImplemented('signTypedData')
  }
  connect(_: Provider): Signer {
    return notImplemented('connect')
  }
}

function notImplemented(method: string): never {
  throw new Error(`MintNftSigner.${method}() not implemented`)
}
