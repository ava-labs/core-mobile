/**
 * Break the circular dependency between store/account/slice.ts and store/posthog.
 *
 * store/account/slice.ts imports selectIsLedgerSupportBlocked and
 * selectIsSolanaSupportBlocked from store/posthog, but
 * store/posthog → store/wallet → ... → store/account creates a cycle that
 * causes the exports to be undefined at module-load time in Jest.
 *
 * This setup file provides standalone implementations of those selectors
 * so the createSelector calls in store/account/slice.ts receive real functions
 * instead of undefined. All other exports are forwarded from the real module.
 */
jest.mock('store/posthog', () => {
  return new Proxy(
    {
      // Inline implementation matching the real selectIsLedgerSupportBlocked.
      selectIsLedgerSupportBlocked: state => {
        const featureFlags = state?.posthog?.featureFlags
        return !featureFlags?.['ledger-support'] || !featureFlags?.everything
      },
      // Inline implementation matching the real selectIsSolanaSupportBlocked.
      selectIsSolanaSupportBlocked: state => {
        const featureFlags = state?.posthog?.featureFlags
        return !featureFlags?.['solana-support'] || !featureFlags?.everything
      }
    },
    {
      get(target, prop) {
        // Return our override if it exists
        if (prop in target) {
          return target[prop]
        }
        // Lazily forward everything else to the real module.
        // The lazy require avoids triggering the circular dependency
        // during module initialisation.
        const actual = jest.requireActual('store/posthog')
        return actual[prop]
      }
    }
  )
})
