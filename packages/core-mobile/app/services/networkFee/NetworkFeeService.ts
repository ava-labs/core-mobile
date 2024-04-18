import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { NetworkFee } from 'services/networkFee/types'
import { BigNumberish } from 'ethers'
import { isSwimmer } from 'services/network/utils/isSwimmerNetwork'
import {
  getBitcoinProvider,
  getEvmProvider
} from 'services/network/utils/providerUtils'
import { AcceptedTypes, TokenBaseUnit } from 'types/TokenBaseUnit'

class NetworkFeeService {
  async getNetworkFee<T extends TokenBaseUnit<T>>(
    network: Network,
    tokenCreator: (value: AcceptedTypes) => T
  ): Promise<NetworkFee<T> | undefined> {
    switch (network.vmName) {
      case NetworkVMType.EVM:
        return await this.getFeesForEVM(network, tokenCreator)
      case NetworkVMType.BITCOIN:
        return await this.getFeesForBtc(network, tokenCreator)
      case NetworkVMType.PVM:
        return await this.getFeesForPVM(network, tokenCreator)
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

  private async getFeesForEVM<T extends TokenBaseUnit<T>>(
    network: Network,
    tokenCreator: (value: AcceptedTypes) => T
  ): Promise<NetworkFee<T> | undefined> {
    const provider = getEvmProvider(network)
    const { maxFeePerGas, maxPriorityFeePerGas } = await provider.getFeeData()
    if (!maxFeePerGas || !maxPriorityFeePerGas) {
      return undefined
    }

    const baseFeePerGasInUnit = tokenCreator(maxFeePerGas)
    const basePriorityFeePerGas = tokenCreator(500000000) //0.5 Gwei

    const lowMaxTip = basePriorityFeePerGas
    const mediumMaxTip = basePriorityFeePerGas.mul(4)
    const highMaxTip = basePriorityFeePerGas.mul(6)
    return {
      baseFee: baseFeePerGasInUnit,
      low: {
        maxFeePerGas: baseFeePerGasInUnit.add(lowMaxTip),
        maxPriorityFeePerGas: lowMaxTip
      },
      medium: {
        maxFeePerGas: baseFeePerGasInUnit.add(mediumMaxTip),
        maxPriorityFeePerGas: mediumMaxTip
      },
      high: {
        maxFeePerGas: baseFeePerGasInUnit.add(highMaxTip),
        maxPriorityFeePerGas: highMaxTip
      },
      isFixedFee: isSwimmer(network)
    }
  }

  private async getFeesForPVM<T extends TokenBaseUnit<T>>(
    network: Network,
    tokenCreator: (value: AcceptedTypes) => T
  ): Promise<NetworkFee<T> | undefined> {
    const baseFeePerGasInUnit = tokenCreator(0.001 * 10 ** 9)

    return {
      baseFee: baseFeePerGasInUnit,
      low: {
        maxFeePerGas: baseFeePerGasInUnit
      },
      medium: {
        maxFeePerGas: baseFeePerGasInUnit
      },
      high: {
        maxFeePerGas: baseFeePerGasInUnit
      },
      isFixedFee: true
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
