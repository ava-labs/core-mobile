import Config from 'react-native-config'
import * as Sentry from '@sentry/react-native'
import { DefaultSampleRate } from 'services/sentry/SentryWrapper'
import { scrub } from 'utils/data/scrubber'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { ErrorEvent, TransactionEvent } from '@sentry/core'
import UserService from 'services/user/UserService'
import { AllowedSentryBreadcrumbCategory } from './types'

if (!Config.SENTRY_DSN)
  // (require cycle)
  // eslint-disable-next-line no-console
  console.warn('SENTRY_DSN is not defined. Sentry is disabled.')

/**
 * Allowlist used by `beforeBreadcrumb`. Hoisted to module scope and held
 * as a Set so the filter — which fires on every breadcrumb — does an O(1)
 * lookup instead of re-allocating an array and scanning it each call.
 */
const ALLOWED_BREADCRUMB_CATEGORIES = new Set<string>(
  Object.values(AllowedSentryBreadcrumbCategory)
)

// if development then only enable if spotlight is enabled
// otherwise enable if not development
const isAvailable =
  ((__DEV__ && DevDebuggingConfig.SENTRY_SPOTLIGHT) ||
    (!__DEV__ && Config.E2E !== 'true')) &&
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
      beforeBreadcrumb: breadcrumb => {
        // Breadcrumbs are dropped by default to prevent unintended data
        // leaks (e.g. console output containing sensitive info). Categories
        // listed in `AllowedSentryBreadcrumbCategory` are explicitly allowlisted.
        if (
          breadcrumb.category &&
          ALLOWED_BREADCRUMB_CATEGORIES.has(breadcrumb.category)
        ) {
          return breadcrumb
        }
        return null
      },
      tracesSampler: samplingContext => {
        return __DEV__ ? 1 : samplingContext.sampleRate ?? DefaultSampleRate
      },
      integrations: [navigationIntegration],
      onReady: async () => {
        Sentry.getGlobalScope().setUser({ id: UserService.getUniqueID() })
      }
    })
  }
}

type CaptureExceptionOptions = {
  value?: unknown
  tags?: Record<string, string>
}

const captureException = (
  message: string,
  options: CaptureExceptionOptions = {}
): void => {
  if (!isAvailable) {
    return
  }

  const { value, tags } = options

  Sentry.withScope(scope => {
    if (tags) scope.setTags(tags)

    if (value instanceof Error) {
      Sentry.captureException(value, { extra: { message } })
    } else {
      Sentry.captureException(
        new Error(message),
        value !== undefined ? { extra: { value } } : undefined
      )
    }
  })
}

/**
 * Converts bigint values to strings so the context can be safely serialized
 * by Sentry (which uses JSON.stringify internally).
 */
const sanitizeContext = (value: unknown): unknown => {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, val) =>
        typeof val === 'bigint' ? val.toString() : val
      )
    )
  } catch {
    // Fall back to a safe object shape so setContext always receives a valid
    // Record and Sentry logging never throws.
    return { value: '[unserializable]' }
  }
}

/* eslint-disable max-params -- positional args preserve the existing call-site
   shape; converting to an options object would touch every caller. */
const captureMessage = (
  message: string,
  context?: Record<string, unknown>,
  tags?: Record<string, string>,
  fingerprint?: string[]
): void => {
  if (!isAvailable) {
    return
  }

  Sentry.withScope(scope => {
    if (context) {
      scope.setContext(
        'details',
        sanitizeContext(context) as Record<string, unknown>
      )
    }
    if (tags) {
      scope.setTags(tags)
    }
    if (fingerprint && fingerprint.length > 0) {
      scope.setFingerprint(fingerprint)
    }
    Sentry.captureMessage(message)
  })
}
/* eslint-enable max-params */

export default {
  init,
  isAvailable,
  captureException,
  captureMessage,
  navigationIntegration
}
