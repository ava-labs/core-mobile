import { isError } from 'ethers'
import { JsonRpcError } from '@metamask/rpc-errors'
import {
  getJsonRpcErrorMessage,
  parseJsonRpcError
} from './getJsonRpcErrorMessage'

jest.mock('ethers', () => ({
  isError: jest.fn()
}))

describe('getJsonRpcErrorMessage', () => {
  it('should return parsed JSON-RPC error message', () => {
    const error = new JsonRpcError(1234, 'Test RPC error')
    expect(getJsonRpcErrorMessage(error)).toBe('Test RPC error')
  })

  it('should return error details if available', () => {
    const error = new Error('Some error')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(error as any).details = 'Detailed error message'
    expect(getJsonRpcErrorMessage(error)).toBe('Detailed error message')
  })

  it('should return error message if details are not available', () => {
    const error = new Error('Some error')
    expect(getJsonRpcErrorMessage(error)).toBe('Some error')
  })

  it('should return unexpected error message for unknown errors', () => {
    expect(getJsonRpcErrorMessage(null)).toBe('Unexpected error')
    expect(getJsonRpcErrorMessage(123)).toBe('Unexpected error')
    expect(getJsonRpcErrorMessage({})).toBe('Unexpected error')
  })
})

describe('parseJsonRpcError', () => {
  beforeEach(() => {
    // @ts-ignore
    ;(isError as jest.Mock).mockReturnValue(false)
  })

  it('should return custom message if provided', () => {
    const error = new JsonRpcError(1234, 'Test RPC error')
    expect(parseJsonRpcError(error, 'Custom message')).toBe('Custom message')
  })

  it('should handle transaction underpriced error', () => {
    const error = new JsonRpcError(1234, 'Test RPC error', {
      cause: { error: { message: 'transaction underpriced' } }
    })
    expect(parseJsonRpcError(error)).toContain(
      'Transaction failed. The gas price or max priority fee is too low'
    )
  })

  it('should handle already known error', () => {
    const error = new JsonRpcError(1234, 'Test RPC error', {
      cause: { error: { message: 'already known' } }
    })
    expect(parseJsonRpcError(error)).toContain(
      'This transaction has already been submitted'
    )
  })

  it('should handle REPLACEMENT_UNDERPRICED error', () => {
    // @ts-ignore
    ;(isError as jest.Mock).mockImplementation((error, code) => {
      return code === 'REPLACEMENT_UNDERPRICED'
    })
    const error = new JsonRpcError(1234, 'Test RPC error', {
      cause: 'REPLACEMENT_UNDERPRICED'
    })
    expect(parseJsonRpcError(error)).toContain(
      'Transaction failed due to an already pending transaction'
    )
  })

  it('should handle INSUFFICIENT_FUNDS error', () => {
    // @ts-ignore
    ;(isError as jest.Mock).mockImplementation((error, code) => {
      return code === 'INSUFFICIENT_FUNDS'
    })
    const error = new JsonRpcError(1234, 'Test RPC error', {
      cause: 'INSUFFICIENT_FUNDS'
    })
    expect(parseJsonRpcError(error)).toContain(
      "You don't have enough funds for this transaction"
    )
  })

  it('should handle NONCE_EXPIRED error', () => {
    // @ts-ignore
    ;(isError as jest.Mock).mockImplementation((error, code) => {
      return code === 'NONCE_EXPIRED'
    })
    const error = new JsonRpcError(1234, 'Test RPC error', {
      cause: 'NONCE_EXPIRED'
    })
    expect(parseJsonRpcError(error)).toContain(
      'Transaction failed because the nonce was already used'
    )
  })

  it('should handle generic error with cause message', () => {
    const error = new JsonRpcError(1234, 'Test RPC error', {
      cause: { message: 'Some cause message' }
    })
    expect(parseJsonRpcError(error)).toContain('Error: Some cause message')
  })

  it('should return default error message if no specific case matches', () => {
    const error = new JsonRpcError(1234, 'Test RPC error')
    expect(parseJsonRpcError(error)).toBe('Test RPC error')
  })
})
