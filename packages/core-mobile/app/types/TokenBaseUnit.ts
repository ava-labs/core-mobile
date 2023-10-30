import BN from 'bn.js'
import Big, { BigSource, RoundingMode } from 'big.js'
import { bigToBigint } from 'utils/bigNumbers/bigToBigint'

export type AcceptedTypes = BigSource | BN | bigint

/**
 * TokenBaseUnit abstracts units in which crypto tokens are represented.
 * It holds value of token in Big type in normal numeric representation (as opposed to exponential or any other).
 * It also holds maxDecimals value which denotes smallest possible denomination for that token.
 *
 * For example, minimal denomination of Eth is Wei where 1 Wei = 1e-18 Eth, which means maxDecimals is 18.
 * Another example is Avax and nAvax where 1 nAvax = 1e-9 Avax, therefore maxDecimals is 9.
 *
 * Constructor of this class accepts constructor of child class as argument so that we can do immutable operations
 * and return correct type from those operations.
 *
 * For example, doing tokenBaseUnit.add(1) won't change tokenBaseUnit's value but rather create new object with same
 * type as tokenBaseUnit.
 */
export abstract class TokenBaseUnit<T extends TokenBaseUnit<T>> {
  protected readonly value: Big
  protected readonly maxDecimals: number
  protected readonly childConstructor: new (value: AcceptedTypes) => T

  protected constructor(
    value: AcceptedTypes,
    maxDecimals: number,
    childConstructor: new (v: AcceptedTypes) => T
  ) {
    this.value = TokenBaseUnit.toBig(value)
    this.maxDecimals = maxDecimals
    this.childConstructor = childConstructor
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

  toDisplay(roundDp?: number): string {
    const wholeDigits = this.value.round(0).toString().length
    if (this.maxDecimals > wholeDigits) {
      return roundDp
        ? this.value.round(roundDp).toFixed()
        : this.value.toFixed(this.maxDecimals - wholeDigits, Big.roundHalfUp)
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
  }

  private cloneWithValue(value: Big): T {
    return new this.childConstructor(value)
  }
}
