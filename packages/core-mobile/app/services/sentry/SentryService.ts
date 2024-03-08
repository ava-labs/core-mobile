import Config from 'react-native-config'
import * as Sentry from '@sentry/react-native'
import { DefaultSampleRate } from 'services/sentry/SentryWrapper'
import { scrub } from 'utils/data/scrubber'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'

if (Config.SENTRY_DSN === undefined)
  throw new Error('SENTRY_DSN is not defined')

// if development then only enable if spotlight is enabled
// otherwise enable if not development
const isAvailable = (__DEV__ && DevDebuggingConfig.SENTRY_SPOTLIGHT) || !__DEV__

const init = (): void => {
  if (isAvailable) {
    Sentry.init({
      dsn: Config.SENTRY_DSN,
      environment: Config.ENVIRONMENT,
      debug: false,
      enableSpotlight: DevDebuggingConfig.SENTRY_SPOTLIGHT,
      beforeSend: event => {
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
      },
      beforeBreadcrumb: () => {
        return null
      },
      tracesSampler: samplingContext => {
        return samplingContext.sampleRate ?? DefaultSampleRate
      },
      integrations: []
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

export default { init, isAvailable, captureException }
