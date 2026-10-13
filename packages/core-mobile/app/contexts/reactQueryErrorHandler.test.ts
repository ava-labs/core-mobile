import { CancelledError } from '@tanstack/query-core'
import Logger from 'utils/Logger'
import {
  onQueryError,
  resetReportedQueryErrors
} from './reactQueryErrorHandler'

jest.mock('utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn()
}))

const queryWithHash = (queryHash: string): { queryHash: string } => ({
  queryHash
})

describe('onQueryError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetReportedQueryErrors()
  })

  it('reports the first occurrence of an error at error level with the query hash as a tag', () => {
    const error = new Error('boom')
    onQueryError(error, queryWithHash('["chains"]'))

    expect(Logger.error).toHaveBeenCalledTimes(1)
    expect(Logger.error).toHaveBeenCalledWith(
      '[ReactQueryProvider] Query error',
      error,
      { queryHash: '["chains"]' }
    )
    expect(Logger.warn).not.toHaveBeenCalled()
  })

  it('truncates long query hashes to the sentry tag value limit', () => {
    onQueryError(new Error('boom'), queryWithHash('x'.repeat(300)))

    const tags = (Logger.error as jest.Mock).mock.calls[0][2]
    expect(tags.queryHash).toHaveLength(200)
  })

  it('downgrades repeats of the same query error to warn', () => {
    const query = queryWithHash('["chains"]')
    onQueryError(new Error('boom'), query)
    onQueryError(new Error('boom'), query)
    onQueryError(new Error('boom'), query)

    expect(Logger.error).toHaveBeenCalledTimes(1)
    expect(Logger.warn).toHaveBeenCalledTimes(2)
  })

  it('reports again when the same query fails with a different message', () => {
    const query = queryWithHash('["chains"]')
    onQueryError(new Error('HTTP 500'), query)
    onQueryError(new Error('HTTP 403'), query)

    expect(Logger.error).toHaveBeenCalledTimes(2)
  })

  it('reports the same error message for different queries independently', () => {
    onQueryError(new Error('boom'), queryWithHash('["a"]'))
    onQueryError(new Error('boom'), queryWithHash('["b"]'))

    expect(Logger.error).toHaveBeenCalledTimes(2)
  })

  it('ignores React Query cancellations entirely', () => {
    onQueryError(new CancelledError(), queryWithHash('["chains"]'))

    expect(Logger.error).not.toHaveBeenCalled()
    expect(Logger.warn).not.toHaveBeenCalled()
  })

  it('handles non-Error rejection values', () => {
    const query = queryWithHash('["chains"]')
    onQueryError('string failure', query)
    onQueryError('string failure', query)

    expect(Logger.error).toHaveBeenCalledTimes(1)
    expect(Logger.warn).toHaveBeenCalledTimes(1)
  })
})
