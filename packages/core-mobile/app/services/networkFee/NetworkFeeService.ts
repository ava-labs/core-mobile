import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { BigNumberish } from 'ethers'
import {
  getBitcoinProvider,
  getEvmProvider
} from 'services/network/utils/providerUtils'
import { AcceptedTypes, TokenBaseUnit } from 'types/TokenBaseUnit'
import ModuleManager from 'vmModule/ModuleManager'
import { NetworkFee } from 'services/networkFee/types'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

class NetworkFeeService {
  async getNetworkFee<T extends TokenBaseUnit<T>>(
    network: Network,
    tokenUnitCreator: (value: AcceptedTypes) => T
  ): Promise<NetworkFee<T> | undefined> {
    switch (network.vmName) {
      case NetworkVMType.AVM:
      case NetworkVMType.PVM:
      case NetworkVMType.EVM: {
        //TODO: use the same logic for all networks once we implement modules for other VMs
        const evmModule = await ModuleManager.loadModuleByNetwork(network)
        const networkFees = await evmModule.getNetworkFee(
          mapToVmNetwork(network)
        )
        return {
          baseFee: tokenUnitCreator(networkFees.baseFee ?? 0),
          low: {
            maxFeePerGas: tokenUnitCreator(networkFees.low.maxFeePerGas),
            maxPriorityFeePerGas: tokenUnitCreator(
              networkFees.low.maxPriorityFeePerGas ?? 0
            )
          },
          medium: {
            maxFeePerGas: tokenUnitCreator(networkFees.medium.maxFeePerGas),
            maxPriorityFeePerGas: tokenUnitCreator(
              networkFees.medium.maxPriorityFeePerGas ?? 0
            )
          },
          high: {
            maxFeePerGas: tokenUnitCreator(networkFees.high.maxFeePerGas),
            maxPriorityFeePerGas: tokenUnitCreator(
              networkFees.high.maxPriorityFeePerGas ?? 0
            )
          },
          isFixedFee: networkFees.isFixedFee
        }
      }
      case NetworkVMType.BITCOIN:
        return await this.getFeesForBtc(network, tokenUnitCreator)
      default:
        return undefined
    }
  }

  private async getFeesForBtc<T extends TokenBaseUnit<T>>(
    network: Network,
    tokenCreator: (value: AcceptedTypes) => T
  ): Promise<NetworkFee<T>> {
    const provider = getBitcoinProvider(network.isTestnet)
    const rates = await provider.getFeeRates()
    return {
      low: {
        maxFeePerGas: tokenCreator(rates.low)
      },
      medium: {
        maxFeePerGas: tokenCreator(rates.medium)
      },
      high: {
        maxFeePerGas: tokenCreator(rates.high)
      },
      isFixedFee: false
    }
  }

  async estimateGasLimit({
    from,
    to,
    data,
    value,
    network
  }: {
    from: string
    to: string
    data?: string
    value?: BigNumberish
    network: Network
  }): Promise<number | null> {
    if (network.vmName !== NetworkVMType.EVM) return null

    const provider = getEvmProvider(network)
    const nonce = await provider.getTransactionCount(from)

    return Number(
      await provider.estimateGas({
        from,
        to,
        nonce,
        data,
        value
      })
    )
  }
}

export default new NetworkFeeService()
