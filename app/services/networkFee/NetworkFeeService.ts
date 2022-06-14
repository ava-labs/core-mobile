import networkService from 'services/network/NetworkService'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { NetworkFee } from 'services/networkFee/types'
import {
  BitcoinProviderAbstract,
  JsonRpcBatchInternal
} from '@avalabs/wallets-sdk'
import Big from 'big.js'
import { BigNumber, BigNumberish } from 'ethers'
import { isSwimmer } from 'services/network/isSwimmerNetwork'

class NetworkFeeService {
  async getNetworkFee(network?: Network): Promise<NetworkFee | null> {
    if (!network) return null

    const provider = networkService.getProviderForNetwork(network)
    if (network.vmName === NetworkVMType.EVM) {
      const price = await (provider as JsonRpcBatchInternal).getGasPrice()
      const bigPrice = new Big(price.toString())
      return {
        displayDecimals: 9,
        low: price,
        medium: BigNumber.from(bigPrice.mul(1.05).toFixed(0)),
        high: BigNumber.from(bigPrice.mul(1.15).toFixed(0)),
        isFixedFee: isSwimmer(network)
      }
    } else if (network.vmName === NetworkVMType.BITCOIN) {
      const rates = await (provider as BitcoinProviderAbstract).getFeeRates()
      return {
        displayDecimals: 0, // btc fees in satoshi
        low: BigNumber.from(rates.low),
        medium: BigNumber.from(rates.medium),
        high: BigNumber.from(rates.high),
        isFixedFee: isSwimmer(network)
      }
    }
    return null
  }

  async estimateGasLimit(
    from: string,
    to: string,
    data: string,
    value: BigNumberish,
    network: Network
  ): Promise<number | null> {
    if (network.vmName !== NetworkVMType.EVM) return null

    const provider = networkService.getProviderForNetwork(network)
    const nonce = await (provider as JsonRpcBatchInternal).getTransactionCount(
      from
    )

    return (
      await (provider as JsonRpcBatchInternal).estimateGas({
        from,
        to,
        nonce,
        data,
        value
      })
    ).toNumber()
  }
}

export default new NetworkFeeService()
