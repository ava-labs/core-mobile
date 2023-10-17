import * as Sentry from '@sentry/react-native'
import { CustomSamplingContext, Transaction } from '@sentry/types'
import { Span } from 'services/sentry/Span'
import { TransactionName } from 'services/sentry/types'

class SentryWrapper {
  private sampleRate = DefaultSampleRate

  public setSampleRate(rate: number) {
    if (!isNaN(rate)) {
      this.sampleRate = rate
    }
  }

  public startTransaction(name: TransactionName): Transaction {
    return Sentry.startTransaction({ name, op: name }, {
      sampleRate: this.sampleRate
    } as CustomSamplingContext)
  }

  public finish(transaction: Transaction) {
    transaction.finish()
  }

  public createSpanFor(sentryTrx?: Transaction): Span {
    return new Span(sentryTrx)
  }
}

export default new SentryWrapper()

export const DefaultSampleRate = 0.1
