import Big from 'big.js'
import BN from 'bn.js'
import { DeserializableValue } from './deserialize'

export type SerializableValue = Big | bigint | BN

/**
 * Prepare data for JSON serialization by converting complex numbers like `Big`,
 * `BN`, etc. into a format that can be auto-deserialized with
 * `deserializeFromJSON`.
 *
 * For example, `new BN(100_000_000_000)` is converted to
 * `{ type: 'BN', value: '100_000_000_000' }`
 */
export function serializeToJSON<T>(value: T): string {
  return JSON.stringify(value, function (key, stringifiedElement) {
    const element = this[key]

    if (isSerializable(element)) {
      return serializeValue(element)
    }

    return stringifiedElement
  })
}

function serializeValue(value: SerializableValue): DeserializableValue {
  if (value instanceof Big) {
    return { type: 'Big', value: value.toFixed() }
  } else if (value instanceof BN) {
    return { type: 'BN', value: value.toString() }
  } else if (typeof value === 'bigint') {
    return { type: 'BigInt', value: value.toString() }
  } else {
    throw new Error('unhandled serialization')
  }
}

function isSerializable(value: unknown): value is SerializableValue {
  return (
    value instanceof Big || value instanceof BN || typeof value === 'bigint'
  )
}
