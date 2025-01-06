import * as Sentry from '@sentry/react-native'
import { OpName, SpanName } from 'services/sentry/types'

class SentryWrapper {
  private sampleRate = DefaultSampleRate

  public setSampleRate(rate: number): void {
    if (!isNaN(rate)) {
      this.sampleRate = rate
    }
  }

  public startSpan<T>(
    props: { name?: SpanName; contextName?: OpName },
    callback: (span?: Sentry.Span) => T
  ): T {
    if (props.name === undefined) {
      return callback(undefined)
    }

    if (props.contextName !== undefined) {
      Sentry.setContext(props.contextName, null)
    }

    return Sentry.startSpan(
      {
        name: props.name,
        op: props.name,
        attributes: {
          'sentry.sample_rate': this.sampleRate
        }
      },
      callback
    )
  }
}

export default new SentryWrapper()

export const DefaultSampleRate = 0.1
