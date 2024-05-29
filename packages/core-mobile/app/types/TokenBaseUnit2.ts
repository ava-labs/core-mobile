import BN from 'bn.js'
import Big, { BigSource } from 'big.js'

export type AcceptedTypes = BigSource | BN | bigint
/**
 * TokenBaseUnit abstracts units in which crypto tokens are represented.
 * It holds value of token in Big type in normal numeric representation (as opposed to exponential or any other).
 * It also holds maxDecimals value which denotes smallest possible denomination for that token.
 *
 * For example, minimal denomination of Eth is Wei where 1 Eth = 1e18 Wei , which means maxDecimals is 18.
 * Another example is Avax and nAvax where 1 Avax = 1e9 nAvax, therefore maxDecimals is 9.
 */
export class TokenBaseUnit2 {
  /**
   * In base unit
   * @protected
   */
  protected readonly value: Big
  protected readonly symbol: string
  protected readonly maxDecimals: number

  constructor(value: AcceptedTypes, maxDecimals: number, symbol: string) {
    this.value = TokenBaseUnit2.toBig(value).div(Big(10).pow(maxDecimals))
    this.maxDecimals = maxDecimals
    this.symbol = symbol
  }

  getSymbol(): string {
    return this.symbol
  }

  getMaxDecimals(): number {
    return this.maxDecimals
  }

  add(value: TokenBaseUnit2 | AcceptedTypes): TokenBaseUnit2 {
    return this.cloneWithValue(this.value.add(TokenBaseUnit2.toBig(value)))
  }

  sub(value: TokenBaseUnit2 | AcceptedTypes): TokenBaseUnit2 {
    return this.cloneWithValue(this.value.sub(TokenBaseUnit2.toBig(value)))
  }

  mul(value: TokenBaseUnit2 | AcceptedTypes): TokenBaseUnit2 {
    return this.cloneWithValue(this.value.mul(TokenBaseUnit2.toBig(value)))
  }

  div(value: TokenBaseUnit2 | AcceptedTypes): TokenBaseUnit2 {
    return this.cloneWithValue(this.value.div(TokenBaseUnit2.toBig(value)))
  }

  gt(value: TokenBaseUnit2 | AcceptedTypes): boolean {
    return this.value.gt(TokenBaseUnit2.toBig(value))
  }

  lt(value: TokenBaseUnit2 | AcceptedTypes): boolean {
    return this.value.lt(TokenBaseUnit2.toBig(value))
  }

  eq(value: TokenBaseUnit2 | AcceptedTypes): boolean {
    return this.value.eq(TokenBaseUnit2.toBig(value))
  }

  /**
   * Tries to display token unit in most meaningful way.
   * Precision of displaying token units makes sense only to up to
   * *maxDecimals* decimal points, just as you would display US dollars up to 2 decimals.
   * However, there's no point in showing all *maxDecimals* decimals if total
   * value is huge, e.g. instead of displaying 1,000,000.000,000,001 we want to
   * display 1,000,000. So in that effort this function will display maximum of
   * **[maxDecimals - wholeDigits]** decimals, where *wholeDigits* is the number of digits
   * of only whole portion of value.
   * @param roundDp
   */
  toDisplay(roundDp?: number): string {
    const wholeDigits = this.value.round(0).toString().length
    if (this.maxDecimals > wholeDigits) {
      return roundDp
        ? this.value.round(roundDp).toFixed()
        : this.value
            .round(this.maxDecimals - wholeDigits, Big.roundHalfUp)
            .toFixed()
    }
    return this.value.toFixed(0, Big.roundHalfUp)
  }

  isZero(): boolean {
    return this.value.eq(0)
  }

  /**
   * Converts this base unit to the smallest unit defined by this.maxDecimals
   * @param round
   */
  toSubUnit(round?: boolean): bigint {
    const rounded = round ? this.value.round(this.maxDecimals) : this.value
    return BigInt(rounded.mul(new Big(10).pow(this.maxDecimals)).toFixed(0))
  }

  private static toBig(value: AcceptedTypes | TokenBaseUnit2): Big {
    switch (typeof value) {
      case 'bigint':
        return Big(BigInt(value).toString())
      case 'string':
        return Big(value)
      case 'number':
        return Big(value)
      case 'object':
        if (value instanceof BN) {
          return Big(value.toString())
        }
        if (value instanceof Big) {
          return value
        }
        return value.value
    }
  }

  private cloneWithValue(value: Big): TokenBaseUnit2 {
    return new TokenBaseUnit2(value, this.maxDecimals, this.symbol)
  }
}
