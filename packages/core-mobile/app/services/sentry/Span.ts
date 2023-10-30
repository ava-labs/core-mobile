import { SpanContext } from '@sentry/types/types/span'
import { Transaction } from '@sentry/types'
import { OpName } from 'services/sentry/types'

export class Span {
  constructor(
    private transaction?: Transaction,
    private spanContext?: Pick<
      SpanContext,
      Exclude<
        keyof SpanContext,
        'spanId' | 'sampled' | 'traceId' | 'parentSpanId'
      >
    >
  ) {}

  public setContext(
    op: OpName,
    spanContext?: Pick<
      SpanContext,
      Exclude<
        keyof SpanContext,
        'spanId' | 'sampled' | 'traceId' | 'parentSpanId'
      >
    >
  ): Span {
    this.spanContext = { ...spanContext, op }
    return this
  }

  public async executeAsync<T>(f: () => Promise<T>): Promise<T> {
    const span = this.transaction?.startChild(this.spanContext)
    try {
      const result = await f()
      span?.setStatus('ok')
      return result
    } catch (err) {
      span?.setStatus('unknown_error')
      throw err
    } finally {
      span?.finish()
    }
  }
}
