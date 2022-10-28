import { SpanContext } from '@sentry/types/types/span'
import { SpanStatus } from '@sentry/tracing'
import { Transaction } from '@sentry/types'

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
    spanContext?: Pick<
      SpanContext,
      Exclude<
        keyof SpanContext,
        'spanId' | 'sampled' | 'traceId' | 'parentSpanId'
      >
    >
  ): Span {
    this.spanContext = spanContext
    return this
  }

  public async executeAsync<T>(f: () => Promise<T>): Promise<T> {
    const span = this.transaction?.startChild(this.spanContext)
    try {
      const result = await f()
      // Do something
      span?.setStatus(SpanStatus.Ok)
      return result
    } catch (err) {
      span?.setStatus(SpanStatus.UnknownError)
      throw err
    } finally {
      span?.finish()
    }
  }
}
