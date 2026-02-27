/**
 * Seedless onboarding E2E
 *
 * Requires:
 * - Device/emulator with Google account (E2E_GOOGLE_EMAIL for account picker)
 * - Seedless feature flags enabled
 * - GOOGLE_OAUTH_CLIENT_* env for the app build
 */
import warmupSeedless from '../../helpers/warmupSeedless'

describe('Onboarding', () => {
  it('[Smoke] Onboard with seedless (Google)', async () => {
    await warmupSeedless()
  })
})
