import * as Sentry from '@sentry/react-native'
import { CustomSamplingContext, Transaction } from '@sentry/types'
import { Span } from 'services/sentry/Span'
import { SentryStorage, TransactionName } from 'services/sentry/types'
import StorageTools from 'repository/StorageTools'

/**
 * Enables keeping track of pending transactions, so we can attach new spans
 * to correct transaction.
 */
class SentryWrapper {
  private sampleRate = DefaultSampleRate

  constructor() {
    StorageTools.loadFromStorageAsObj<number | undefined>(SentryStorage).then(
      value => {
        this.sampleRate = value ?? this.sampleRate
      }
    )
  }

  /**
   * Always use this function to crate transaction. Otherwise, retrieving
   * transaction with Sentry.getCurrentHub().getScope().getTransaction() will
   * be problematic in concurrent code.
   * @param name - Name of transaction
   */
  public startTransaction(name: TransactionName): Transaction {
    const transaction = Sentry.startTransaction({ name, op: name }, {
      sampleRate: this.sampleRate
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
