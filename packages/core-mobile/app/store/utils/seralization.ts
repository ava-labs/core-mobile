import { EmptyObject } from 'redux'
import { RawRootState } from 'store/index'

export function serializeReduxState(reduxState: EmptyObject): string {
  return JSON.stringify(reduxState, (key, value) =>
    typeof value === 'bigint' ? 'bigint' + value.toString() : value
  )
}
export function deserializeReduxState(
  serializedReduxState: string
): RawRootState {
  return JSON.parse(serializedReduxState, (key, value) =>
    typeof value === 'string' && value.startsWith('bigint')
      ? BigInt(value.substring('bigint'.length))
      : value
  )
}
