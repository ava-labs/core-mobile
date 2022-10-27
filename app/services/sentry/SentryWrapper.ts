import * as Sentry from '@sentry/react-native'
import { Transaction } from '@sentry/types'
import { Span } from 'services/sentry/Span'
import { TransactionName } from 'services/sentry/types'

/**
 * Enables keeping track of pending transactions, so we can attach new spans
 * to correct transaction.
 */
class SentryWrapper {
  /**
   * Always use this function to crate transaction. Otherwise, retrieving
   * transaction with Sentry.getCurrentHub().getScope().getTransaction() will
   * be problematic in concurrent code.
   * @param name - Name of transaction
   */
  public startTransaction(name: TransactionName): Transaction {
    return Sentry.startTransaction({ name, op: name })
  }

  public finish(transaction: Transaction) {
    transaction.finish()
  }

  public createSpanFor(sentryTrx?: Transaction): Span {
    return new Span(sentryTrx)
  }
}

export default new SentryWrapper()
