import BN from 'bn.js'
import Big, { BigSource, RoundingMode } from 'big.js'
import { bigToBigint } from 'utils/bigNumbers/bigToBigint'

export type AcceptedTypes = BigSource | BN | bigint

export interface TokenBaseInterface {
  add(value: AcceptedTypes | TokenBaseInterface): TokenBaseInterface
}

export abstract class TokenBaseUnit<T extends TokenBaseUnit<T>> {
  protected readonly value: Big
  protected readonly maxDecimals: number
  protected readonly childConstructor: new (
    value: AcceptedTypes,
    maxDecimals: number
  ) => T

  protected constructor(
    value: AcceptedTypes,
    maxDecimals: number,
    ctor: new (v: AcceptedTypes, m: number) => T
  ) {
    this.value = TokenBaseUnit.toBig(value)
    this.maxDecimals = maxDecimals
    this.childConstructor = ctor
  }

  add(value: TokenBaseUnit<T> | AcceptedTypes): T {
    return this.cloneWithValue(this.value.add(TokenBaseUnit.toBig(value)))
  }

  sub(value: TokenBaseUnit<T> | AcceptedTypes): T {
    return this.cloneWithValue(this.value.sub(TokenBaseUnit.toBig(value)))
  }

  mul(value: TokenBaseUnit<T> | AcceptedTypes): T {
    return this.cloneWithValue(this.value.mul(TokenBaseUnit.toBig(value)))
  }

  div(value: TokenBaseUnit<T> | AcceptedTypes): T {
    return this.cloneWithValue(this.value.div(TokenBaseUnit.toBig(value)))
  }

  gt(value: TokenBaseUnit<T> | AcceptedTypes): boolean {
    return this.value.gt(TokenBaseUnit.toBig(value))
  }

  lt(value: TokenBaseUnit<T> | AcceptedTypes): boolean {
    return this.value.lt(TokenBaseUnit.toBig(value))
  }

  eq(value: TokenBaseUnit<T> | AcceptedTypes): boolean {
    return this.value.eq(TokenBaseUnit.toBig(value))
  }

  cut(dp: number): T {
    return this.cloneWithValue(this.value.round(dp, Big.roundDown))
  }

  toFixed(dp?: number, rm?: RoundingMode): string {
    return this.value.toFixed(dp, rm)
  }

  toDisplay(): string {
    const wholeDigits = this.value.round(0).toString().length
    if (this.maxDecimals > wholeDigits) {
      return this.value.toFixed(this.maxDecimals - wholeDigits, Big.roundHalfUp)
    }
    return this.value.toFixed(0, Big.roundHalfUp)
  }

  toString(): string {
    return this.value.toString()
  }

  isZero(): boolean {
    return this.value.eq(0)
  }

  /**
   * Converts this base unit to the smallest denomination defined by this.maxDecimals
   * @param round
   */
  toSubUnit(round?: boolean): bigint {
    const rounded = round ? this.value.round(this.maxDecimals) : this.value
    return bigToBigint(rounded, this.maxDecimals)
  }

  static toBig<T extends TokenBaseUnit<T>>(
    value: AcceptedTypes | TokenBaseUnit<T>
  ): Big {
    switch (typeof value) {
      case 'bigint':
        return Big(BigInt(value as bigint).toString())
      case 'string':
        return Big(value as string)
      case 'number':
        return Big(value as number)
      case 'object':
        if (value instanceof BN) {
          return Big((value as BN).toString())
        }
        if (value instanceof Big) {
          return value as Big
        }
        return value.value
    }
    throw Error('Not valid type')
  }

  private cloneWithValue(value: Big): T {
    return new this.childConstructor(value, this.maxDecimals)
  }
}
