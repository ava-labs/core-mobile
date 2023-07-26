import BN from 'bn.js'
import Big, { BigSource } from 'big.js'
import { TokenBaseUnit } from 'types/TokenBaseUnit'

export type AcceptedTypes = BigSource | BN | bigint

export class BaseAvax extends TokenBaseUnit<BaseAvax> {
  constructor(value: AcceptedTypes) {
    super(value, 9, BaseAvax)
  }

  static fromBase(value: AcceptedTypes): BaseAvax {
    return new BaseAvax(value)
  }

  static fromNanoAvax(value: AcceptedTypes): BaseAvax {
    const baseValue = TokenBaseUnit.toBig(value).div(Big(10).pow(9))
    return new BaseAvax(baseValue)
  }

  static fromWei(value: AcceptedTypes): BaseAvax {
    const baseValue = TokenBaseUnit.toBig(value).div(Big(10).pow(18))
    return new BaseAvax(baseValue)
  }

  toWei(): BN {
    return new BN(this.value.mul(Big(10).pow(18)).toFixed(0))
  }
}
