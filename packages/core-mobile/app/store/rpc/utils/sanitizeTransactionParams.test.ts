import { sanitizeRpcParams } from './sanitizeTransactionParams'

describe('sanitizeRpcParams', () => {
  it('converts null values to undefined in transaction objects within an array', () => {
    const params = [
      {
        from: '0xabc',
        to: '0xdef',
        data: '0x1234',
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        gas: '0x5208'
      }
    ]

    const result = sanitizeRpcParams(params)

    expect(result).toEqual([
      {
        from: '0xabc',
        to: '0xdef',
        data: '0x1234',
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        gas: '0x5208'
      }
    ])
  })

  it('does not modify non-null values', () => {
    const params = [
      {
        from: '0xabc',
        to: '0xdef',
        maxFeePerGas: '0x1',
        maxPriorityFeePerGas: '0x2'
      }
    ]

    const result = sanitizeRpcParams(params)

    expect(result).toEqual(params)
  })

  it('handles params that are not an array', () => {
    const params = { from: '0xabc', to: '0xdef', maxFeePerGas: null }

    const result = sanitizeRpcParams(params)

    expect(result).toEqual(params)
  })

  it('handles params with no null values', () => {
    const params = [{ from: '0xabc', to: '0xdef' }]

    const result = sanitizeRpcParams(params)

    expect(result).toEqual(params)
  })

  it('handles non-object array items', () => {
    const params = ['0xabc', 123, null]

    const result = sanitizeRpcParams(params)

    expect(result).toEqual(['0xabc', 123, null])
  })

  it('handles empty array', () => {
    expect(sanitizeRpcParams([])).toEqual([])
  })

  it('passes through undefined/null/primitive params unchanged', () => {
    expect(sanitizeRpcParams(undefined)).toBeUndefined()
    expect(sanitizeRpcParams(null)).toBeNull()
    expect(sanitizeRpcParams('hello')).toBe('hello')
  })

  it('preserves nested objects within array items', () => {
    const params = [
      {
        from: '0xabc',
        accessList: [{ address: '0x1', storageKeys: ['0x2'] }],
        maxFeePerGas: null
      }
    ]

    const result = sanitizeRpcParams(params)

    expect(result).toEqual([
      {
        from: '0xabc',
        accessList: [{ address: '0x1', storageKeys: ['0x2'] }],
        maxFeePerGas: undefined
      }
    ])
  })
})
