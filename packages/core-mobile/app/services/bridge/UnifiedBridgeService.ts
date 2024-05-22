import {
  createUnifiedBridgeService,
  Environment,
  BridgeTransfer,
  BridgeType,
  BridgeAsset,
  ChainAssetMap,
  Chain,
  TokenType,
  Signer
} from '@avalabs/bridge-unified'
import { Network } from '@avalabs/chains-sdk'
import { ethErrors } from 'eth-rpc-errors'
import { chainIdToCaip } from 'utils/data/caip'
import { Account } from 'store/account/types'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'
import { assertNotUndefined } from 'utils/assertions'
import Logger from 'utils/Logger'
import { bigToBigInt, noop } from '@avalabs/utils-sdk'
import { isUnifiedBridgeAsset } from 'screens/bridge/utils/bridgeUtils'
import { Asset } from '@avalabs/bridge-sdk'
import Big from 'big.js'
import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction/utils'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { RpcMethod } from 'store/rpc/types'

type BridgeService = ReturnType<typeof createUnifiedBridgeService>

export class UnifiedBridgeService {
  #service: BridgeService | undefined

  // init and fetch configs
  async init({
    environment,
    disabledBridgeTypes
  }: {
    environment: Environment
    disabledBridgeTypes: BridgeType[]
  }): Promise<void> {
    Logger.info('initializing unified bridge service', {
      environment,
      disabledBridgeTypes
    })

    this.service = createUnifiedBridgeService({
      environment,
      disabledBridgeTypes
    })

    await this.service.init()
  }

  isInitialized(): boolean {
    return this.#service !== undefined
  }

  getBridgeAddresses(): string[] {
    const addresses: string[] = []

    this.service.bridges.forEach(bridge => {
      if (bridge.config) {
        addresses.push(
          ...bridge.config.map(
            ({ tokenRouterAddress }) => tokenRouterAddress as string
          )
        )
      }
    })

    return addresses
  }

  async getAssets(): Promise<ChainAssetMap> {
    return this.service.getAssets()
  }

  async getFee({
    asset,
    amount,
    sourceNetwork,
    targetNetwork
  }: {
    asset: BridgeAsset
    amount: bigint
    sourceNetwork: Network
    targetNetwork: Network
  }): Promise<bigint> {
    const feeMap = await this.service.getFees({
      asset,
      amount,
      targetChain: await this.buildChain(targetNetwork),
      sourceChain: await this.buildChain(sourceNetwork)
    })

    const fee = asset.address && feeMap[asset.address]

    if (!fee) {
      throw ethErrors.rpc.invalidRequest({
        data: {
          reason: 'invalid fee'
        }
      })
    }

    return fee
  }

  async transfer({
    asset,
    amount,
    targetNetwork,
    activeNetwork,
    activeAccount,
    updateListener,
    request
  }: {
    asset: BridgeAsset
    amount: bigint
    targetNetwork: Network
    activeNetwork: Network
    activeAccount: Account
    updateListener: (transfer: BridgeTransfer) => void
    request: Request
  }): Promise<BridgeTransfer> {
    if (isBitcoinNetwork(activeNetwork)) {
      throw ethErrors.rpc.invalidParams({
        data: {
          reason: 'unsupported network'
        }
      })
    }

    const sourceChain = await this.buildChain(activeNetwork)
    const targetChain = await this.buildChain(targetNetwork)

    const sign: Signer = async ({ from, to, data }) => {
      if (typeof to !== 'string') throw new Error('invalid to field')

      const txParams: [TransactionParams] = [
        {
          from,
          to,
          data: data ?? undefined
        }
      ]

      return request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: txParams,
        chainId: activeNetwork.chainId
      }) as Promise<`0x${string}`>
    }

    const bridgeTransfer = await this.service.transferAsset({
      asset,
      fromAddress: activeAccount.addressC,
      amount,
      sourceChain,
      targetChain,
      onStepChange: noop,
      sign
    })

    this.trackTransfer(bridgeTransfer, updateListener)

    return bridgeTransfer
  }

  trackTransfer(
    bridgeTransfer: BridgeTransfer,
    updateListener: (transfer: BridgeTransfer) => void
  ): void {
    this.service.trackTransfer({
      bridgeTransfer,
      updateListener
    })
  }

  async estimateGas({
    asset,
    amount,
    activeAccount,
    sourceNetwork,
    targetNetwork
  }: {
    asset: Asset | BridgeAsset
    amount: Big
    activeAccount: Account
    sourceNetwork: Network
    targetNetwork?: Network
  }): Promise<bigint> {
    if (!activeAccount) {
      throw new Error('no active account found')
    }

    if (!targetNetwork) {
      throw new Error('no target network found')
    }

    if (isBitcoinNetwork(sourceNetwork)) {
      throw ethErrors.rpc.invalidParams({
        data: {
          reason: 'unsupported network'
        }
      })
    }

    if (!isUnifiedBridgeAsset(asset)) {
      throw new Error('Asset is not supported ')
    }

    const sourceChain = await this.buildChain(sourceNetwork)
    const targetChain = await this.buildChain(targetNetwork)

    const fromAddress = activeAccount.addressC as `0x${string}`

    return await this.service.estimateGas({
      asset,
      fromAddress,
      amount: bigToBigInt(amount, asset.decimals),
      sourceChain,
      targetChain
    })
  }

  private async buildChain(network: Network): Promise<Chain> {
    return {
      chainId: chainIdToCaip(network.chainId),
      chainName: network.chainName,
      rpcUrl: network.rpcUrl,
      networkToken: {
        ...network.networkToken,
        type: TokenType.NATIVE
      },
      utilityAddresses: {
        multicall: network.utilityAddresses?.multicall as `0x${string}`
      }
    }
  }

  private get service(): BridgeService {
    assertNotUndefined(this.#service, 'brige service is not initialized')
    return this.#service
  }

  private set service(service: BridgeService) {
    this.#service = service
  }
}

export default new UnifiedBridgeService()
