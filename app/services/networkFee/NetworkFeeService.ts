import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { NetworkFee } from 'services/networkFee/types'
import Big from 'big.js'
import { BigNumberish } from 'ethers'
import { isSwimmer } from 'services/network/utils/isSwimmerNetwork'
import { isEthereumNetwork } from 'services/network/utils/isEthereumNetwork'
import {
  getBitcoinProvider,
  getEvmProvider
} from 'services/network/utils/providerUtils'

class NetworkFeeService {
  async getNetworkFee(network: Network): Promise<NetworkFee | null> {
    if (network.vmName === NetworkVMType.EVM) {
      const provider = getEvmProvider(network)
      const price = await provider.getFeeData()
      const bigPrice = new Big(price.gasPrice?.toString() || '0')
      const unit = isEthereumNetwork(network) ? 'gWEI' : 'nAVAX'

      return {
        displayDecimals: 9,
        nativeTokenDecimals: 18,
        unit,
        low: price.gasPrice ?? 0n,
        medium: BigInt(bigPrice.mul(1.05).toFixed(0)),
        high: BigInt(bigPrice.mul(1.15).toFixed(0)),
        isFixedFee: isSwimmer(network),
        nativeTokenSymbol: network.networkToken.symbol
      }
    } else if (network.vmName === NetworkVMType.BITCOIN) {
      const provider = getBitcoinProvider(network.isTestnet)
      const rates = await provider.getFeeRates()
      return {
        displayDecimals: 0, // display btc fees in satoshi
        nativeTokenDecimals: 8,
        unit: 'satoshi',
        low: BigInt(rates.low),
        medium: BigInt(rates.medium),
        high: BigInt(rates.high),
        isFixedFee: false,
        nativeTokenSymbol: network.networkToken.symbol
      }
    }
    return null
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
