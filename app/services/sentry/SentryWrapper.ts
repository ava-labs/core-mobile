import * as Sentry from '@sentry/react-native'
import { CustomSamplingContext, Transaction } from '@sentry/types'
import { Span } from 'services/sentry/Span'
import { TransactionName } from 'services/sentry/types'

class SentryWrapper {
  private sampleRate = DefaultSampleRate
  private sampleRatesPerTx = {} as Record<TransactionName, number>

  public setSampleRate(rate: number) {
    if (!isNaN(rate)) {
      this.sampleRate = rate
    }
  }

  public setSampleRatesPerTx(rates: Record<TransactionName, number>) {
    this.sampleRatesPerTx = rates
  }

  public startTransaction(name: TransactionName): Transaction {
    const transaction = Sentry.startTransaction({ name, op: name }, {
      sampleRate: this.sampleRatesPerTx[name] || this.sampleRate
    } as CustomSamplingContext)
    return transaction
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
