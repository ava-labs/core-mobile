import Big from 'big.js'
import { AcceptedTypes, TokenBaseUnit } from 'types/TokenBaseUnit'
import { Network } from '@avalabs/chains-sdk'
import BN from 'bn.js'

/**
 * Token unit based on Network data.
 *
 * Motivation for creating this class is that most if not all units can be created
 * from information from Network type.
 * For example, C-chain, Ether, Btc and all subnets have corresponding Network object
 * with networkToken prop which holds info about denomination (decimals) and symbol.
 * So constructing concrete class of TokenBaseUnit from that info results in NetworkTokenUnit.
 */
export class NetworkTokenUnit extends TokenBaseUnit<NetworkTokenUnit> {
  constructor(value: AcceptedTypes, maxDecimals: number, symbol: string) {
    super(value, maxDecimals, symbol, NetworkTokenUnit)
  }

  static fromNetwork(
    network: Network,
    valueInSmallestDenomination?: AcceptedTypes
  ): TokenBaseUnit<NetworkTokenUnit> {
    const baseValue = valueInSmallestDenomination
      ? TokenBaseUnit.toBig(valueInSmallestDenomination).div(
          Big(10).pow(network.networkToken.decimals)
        )
      : 0
    return new NetworkTokenUnit(
      baseValue,
      network.networkToken.decimals,
      network.networkToken.symbol
    )
  }

  static fromBalanceToken(
    token: {
      balance: BN
      decimals: number
      symbol: string
    },
    value?: AcceptedTypes
  ): TokenBaseUnit<NetworkTokenUnit> {
    const baseValue = TokenBaseUnit.toBig(value ? value : token.balance).div(
      Big(10).pow(token.decimals)
    )
    return new NetworkTokenUnit(baseValue, token.decimals, token.symbol)
  }

  static getConstructor(
    network: Network
  ): (value: AcceptedTypes) => NetworkTokenUnit {
    return (value: AcceptedTypes) => {
      return this.fromNetwork(network, value)
    }
  }
}
