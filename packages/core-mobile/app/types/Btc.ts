import Big from 'big.js'
import { AcceptedTypes, TokenBaseUnit } from 'types/TokenBaseUnit'

export class Btc extends TokenBaseUnit<Btc> {
  constructor(value: AcceptedTypes) {
    super(value, 8, 'BTC', Btc)
  }

  static fromBase(value: AcceptedTypes): Btc {
    return new Btc(value)
  }

  static fromSatoshi(value: AcceptedTypes): Btc {
    const baseValue = TokenBaseUnit.toBig(value).div(Big(10).pow(8))
    return new Btc(baseValue)
  }

  toSatoshi(): bigint {
    return BigInt(this.value.mul(Big(10).pow(8)).toFixed(0))
  }

  toFeeUnit(): string {
    return this.toSatoshi().toString()
  }

  newFromFeeUnit(value?: AcceptedTypes): Btc {
    return Btc.fromSatoshi(value ?? 0)
  }
}
