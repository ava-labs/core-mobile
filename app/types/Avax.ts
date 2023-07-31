import BN from 'bn.js'
import Big from 'big.js'
import { AcceptedTypes, TokenBaseUnit } from 'types/TokenBaseUnit'

export class Avax extends TokenBaseUnit<Avax> {
  constructor(value: AcceptedTypes) {
    super(value, 9, Avax)
  }

  static fromBase(value: AcceptedTypes): Avax {
    return new Avax(value)
  }

  static fromNanoAvax(value: AcceptedTypes): Avax {
    const baseValue = TokenBaseUnit.toBig(value).div(Big(10).pow(9))
    return new Avax(baseValue)
  }

  static fromWei(value: AcceptedTypes): Avax {
    const baseValue = TokenBaseUnit.toBig(value).div(Big(10).pow(18))
    return new Avax(baseValue)
  }

  toWei(): BN {
    return new BN(this.value.mul(Big(10).pow(18)).toFixed(0))
  }

  toNano(): BN {
    return new BN(this.value.mul(Big(10).pow(9)).toFixed(0))
  }

  toWeiBigInt(): bigint {
    return BigInt(this.value.mul(Big(10).pow(18)).toFixed(0))
  }
}
