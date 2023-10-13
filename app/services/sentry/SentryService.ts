import Config from 'react-native-config'
import * as Sentry from '@sentry/react-native'
import { DefaultSampleRate } from 'services/sentry/SentryWrapper'
import { scrub } from 'utils/data/scrubber'

const isAvailable = Config.SENTRY_DSN !== undefined && !__DEV__

const init = () => {
  if (isAvailable) {
    Sentry.init({
      dsn: Config.SENTRY_DSN,
      environment: Config.ENVIRONMENT,
      debug: false,
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

export default { init, isAvailable }
