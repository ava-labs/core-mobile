import Config from 'react-native-config'
import * as Sentry from '@sentry/react-native'
import { DefaultSampleRate } from 'services/sentry/SentryWrapper'
import { scrub } from 'utils/data/scrubber'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { ErrorEvent, TransactionEvent } from '@sentry/core'

if (!Config.SENTRY_DSN)
  // (require cycle)
  // eslint-disable-next-line no-console
  console.warn('SENTRY_DSN is not defined. Sentry is disabled.')

// if development then only enable if spotlight is enabled
// otherwise enable if not development
const isAvailable =
  ((__DEV__ && DevDebuggingConfig.SENTRY_SPOTLIGHT) ||
    (!__DEV__ && process.env.E2E !== 'true')) &&
  !!Config.SENTRY_DSN

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true
})

function scrubSentryData<T extends ErrorEvent | TransactionEvent>(event: T): T {
  /**
   * eliminating breadcrumbs. This should eliminate
   * a massive amount of the data leaks into sentry. If we find that console
   * is leaking data, suspected that it might, than we can review the leak and
   * see if we can modify the data before it is recorded. This can be
   * done in the sentry options beforeBreadcrumbs function.
   */
  delete event?.user?.email
  delete event?.user?.ip_address
  delete event.contexts?.device?.name

  try {
    const eventStr = JSON.stringify(event)
    const scrubbedEventStr = scrub(eventStr)
    return JSON.parse(scrubbedEventStr)
  } catch (error) {
    return event
  }
}

const init = (): void => {
  if (isAvailable) {
    Sentry.init({
      // disabling promise patching since it is affecting app performance
      // instead, we are patching promise ourselves with es6-promise
      // TODO: re-enable patchGlobalPromise here https://ava-labs.atlassian.net/browse/CP-8616
      patchGlobalPromise: false,
      dsn: Config.SENTRY_DSN,
      environment: Config.ENVIRONMENT,
      debug: false,
      spotlight: DevDebuggingConfig.SENTRY_SPOTLIGHT,
      beforeSend: scrubSentryData,
      beforeSendTransaction: scrubSentryData,
      beforeBreadcrumb: () => {
        return null
      },
      tracesSampler: samplingContext => {
        return __DEV__ ? 1 : samplingContext.sampleRate ?? DefaultSampleRate
      },
      integrations: [navigationIntegration]
    })
  }
}

const captureException = (message: string, value?: unknown): void => {
  if (!isAvailable) {
    return
  }

  if (value instanceof Error) {
    Sentry.captureException(value, { extra: { message } })
  } else {
    Sentry.captureException(
      new Error(message),
      value !== undefined ? { extra: { value } } : undefined
    )
  }
}

export default { init, isAvailable, captureException, navigationIntegration }
