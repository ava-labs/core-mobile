import { BatchSigningUnsupportedError, isBatchSigningUnsupportedError } from './errors'

describe('BatchSigningUnsupportedError', () => {
  it('is identified by its type guard', () => {
    const err = new BatchSigningUnsupportedError('LEDGER')
    expect(isBatchSigningUnsupportedError(err)).toBe(true)
    expect(err.message).toContain('LEDGER')
  })

  it('rejects unrelated errors', () => {
    expect(isBatchSigningUnsupportedError(new Error('nope'))).toBe(false)
    expect(isBatchSigningUnsupportedError(undefined)).toBe(false)
  })
})
