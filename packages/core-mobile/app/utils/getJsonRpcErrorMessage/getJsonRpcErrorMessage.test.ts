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

  describe('Solana errors', () => {
    it('should handle -32002 with Blockhash not found', () => {
      const error = new JsonRpcError(1234, 'Test RPC error', {
        cause: {
          error: { message: 'Solana error #-32002; Blockhash not found' }
        }
      })
      expect(parseJsonRpcError(error)).toBe(
        'Transaction failed: The network is experiencing high load. Please try again.'
      )
    })

    it('should handle generic -32002 error', () => {
      const error = new JsonRpcError(1234, 'Test RPC error', {
        cause: {
          error: { message: 'Error -32002: Transaction simulation failed' }
        }
      })
      expect(parseJsonRpcError(error)).toBe(
        'Transaction failed: Please verify your transaction details and try again.'
      )
    })

    it('should handle -32003 signature verification error', () => {
      const error = new JsonRpcError(1234, 'Test RPC error', {
        cause: {
          error: {
            message: 'Error -32003: Transaction signature verification failure'
          }
        }
      })
      expect(parseJsonRpcError(error)).toBe(
        'Transaction failed: Invalid signature. Please check your account has sufficient permissions.'
      )
    })

    it('should handle -32004 network timeout', () => {
      const error = new JsonRpcError(1234, 'Test RPC error', {
        cause: {
          error: { message: 'Error -32004: Block not available for slot x' }
        }
      })
      expect(parseJsonRpcError(error)).toBe(
        'Transaction failed: Network timeout. Please try again.'
      )
    })

    it('should handle -32005 network delay', () => {
      const error = new JsonRpcError(1234, 'Test RPC error', {
        cause: {
          error: {
            message:
              'Error -32005: Node is unhealthy Node is behind by xxxx slots'
          }
        }
      })
      expect(parseJsonRpcError(error)).toBe(
        'Transaction failed: Network is temporarily experiencing delays. Please try again in a moment.'
      )
    })

    it('should handle -32007/-32009 network sync issues', () => {
      const error32007 = new JsonRpcError(1234, 'Test RPC error', {
        cause: {
          error: {
            message:
              'Error -32007: Slot xxxxx was skipped, or missing due to ledger jump to recent snapshot'
          }
        }
      })
      expect(parseJsonRpcError(error32007)).toBe(
        'Transaction failed: Network synchronization issue. Please try again.'
      )

      const error32009 = new JsonRpcError(1234, 'Test RPC error', {
        cause: {
          error: {
            message:
              'Error -32009: Slot xxxxx was skipped, or missing in long-term storage'
          }
        }
      })
      expect(parseJsonRpcError(error32009)).toBe(
        'Transaction failed: Network synchronization issue. Please try again.'
      )
    })

    it('should handle -32010 invalid transaction data', () => {
      const error = new JsonRpcError(1234, 'Test RPC error', {
        cause: {
          error: {
            message:
              'Error -32010: xxxxxx excluded from account secondary indexes'
          }
        }
      })
      expect(parseJsonRpcError(error)).toBe(
        'Transaction failed: Invalid transaction data. Please check your transaction details.'
      )
    })

    it('should handle -32013 invalid signature length', () => {
      const error = new JsonRpcError(1234, 'Test RPC error', {
        cause: {
          error: {
            message:
              'Error -32013: There is a mismatch in the length of the transaction signature'
          }
        }
      })
      expect(parseJsonRpcError(error)).toBe(
        'Transaction failed: Invalid signature format.'
      )
    })

    it('should handle -32015 unsupported version', () => {
      const error = new JsonRpcError(1234, 'Test RPC error', {
        cause: {
          error: {
            message: 'Error -32015: Transaction version (0) is not supported'
          }
        }
      })
      expect(parseJsonRpcError(error)).toBe(
        'Transaction failed: Unsupported transaction version. Please update your wallet.'
      )
    })

    it('should handle -32602 invalid parameters', () => {
      const error = new JsonRpcError(1234, 'Test RPC error', {
        cause: { error: { message: 'Error -32602: Invalid params: xxxxx' } }
      })
      expect(parseJsonRpcError(error)).toBe(
        'Transaction failed: Invalid parameters. Please check your transaction details.'
      )
    })

    it('should fallback to default error handling for unknown Solana errors', () => {
      const error = new JsonRpcError(1234, 'Test RPC error', {
        cause: { error: { message: 'Error -99999: Some unknown error' } }
      })
      expect(parseJsonRpcError(error)).toBe(
        'Test RPC error\nError: Error -99999: Some unknown error'
      )
    })
  })
})
