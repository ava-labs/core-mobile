import {
  createUnifiedBridgeService,
  Environment,
  BridgeTransfer,
  BridgeType,
  BridgeAsset,
  ChainAssetMap,
  Chain,
  TokenType,
  Signer,
  getEnabledBridgeServices,
  isErc20Asset
} from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { rpcErrors } from '@metamask/rpc-errors'
import { chainIdToCaip } from 'utils/data/caip'
import { Account } from 'store/account/types'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'
import { assertNotUndefined } from 'utils/assertions'
import Logger from 'utils/Logger'
import { bigToBigInt, noop } from '@avalabs/core-utils-sdk'
import { isUnifiedBridgeAsset } from 'screens/bridge/utils/bridgeUtils'
import { Asset } from '@avalabs/core-bridge-sdk'
import Big from 'big.js'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { RpcMethod } from 'store/rpc/types'
import { TransactionParams } from '@avalabs/evm-module'
import { getEvmCaip2ChainId } from 'temp/caip2ChainIds'

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

    const enabledBridgeServices = await getEnabledBridgeServices(
      environment,
      disabledBridgeTypes
    )

    this.service = createUnifiedBridgeService({
      environment,
      enabledBridgeServices
    })
  }

  isInitialized(): boolean {
    return this.#service !== undefined
  }

  getBridgeAddresses(): string[] {
    const addresses: string[] = []

    // this.service.bridges.forEach(bridge => {
    //   if (bridge.config) {
    //     addresses.push(
    //       ...bridge.config.map(
    //         ({ tokenRouterAddress }) => tokenRouterAddress as string
    //       )
    //     )
    //   }
    // })

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

    if (isErc20Asset(asset) && asset.address) {
      const address = asset.address.toLowerCase() as `0x${string}`
      const fee = feeMap[address]

      if (!fee) {
        // todo: handle this properly
        return 0n
        // throw new Error('invalid fee')
      }

      return fee
    } else {
      throw new Error('invalid asset')
    }
  }

  async transfer({
    asset,
    amount,
    targetNetwork,
    sourceNetwork,
    activeAccount,
    updateListener,
    request
  }: {
    asset: BridgeAsset
    amount: bigint
    targetNetwork: Network
    sourceNetwork: Network
    activeAccount: Account
    updateListener: (transfer: BridgeTransfer) => void
    request: Request
  }): Promise<BridgeTransfer> {
    if (isBitcoinNetwork(sourceNetwork)) {
      throw rpcErrors.invalidParams({
        data: {
          reason: 'unsupported network'
        }
      })
    }

    const sourceChain = await this.buildChain(sourceNetwork)
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
        chainId: getEvmCaip2ChainId(sourceNetwork.chainId)
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
      throw rpcErrors.invalidParams({
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
