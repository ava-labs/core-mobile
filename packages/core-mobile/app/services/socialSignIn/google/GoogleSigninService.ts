import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes
} from '@react-native-google-signin/google-signin'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { OidcPayload } from 'seedless/types'

if (!Config.GOOGLE_OAUTH_CLIENT_WEB_ID) {
  Logger.warn(
    'GOOGLE_OAUTH_CLIENT_WEB_ID is missing in env file. GoogleSignInService is disabled.'
  )
}

if (!Config.GOOGLE_OAUTH_CLIENT_IOS_ID) {
  Logger.warn(
    'GOOGLE_OAUTH_CLIENT_IOS_ID is missing in env file. GoogleSignInService is disabled.'
  )
}

const GOOGLE_SIGN_IN_ENABLED =
  Config.GOOGLE_OAUTH_CLIENT_WEB_ID && Config.GOOGLE_OAUTH_CLIENT_IOS_ID
if (GOOGLE_SIGN_IN_ENABLED) {
  GoogleSignin.configure({
    webClientId: Config.GOOGLE_OAUTH_CLIENT_WEB_ID,
    iosClientId: Config.GOOGLE_OAUTH_CLIENT_IOS_ID
  })
}

/**
 * Service for Google Sign-In.
 * https://github.com/react-native-google-signin/google-signin
 *
 * Uses the legacy GoogleSignIn API (v13.x), NOT Credential Manager.
 * The legacy API depends on Google Play Services on Android to issue
 * an OIDC id token via `requestIdToken(webClientId)`.
 *
 * Known failure modes (see Sentry issues CORE-REACT-NATIVE-575, 5BD):
 *
 * 1. "empty token" — signIn() succeeds (returns user info) but idToken
 *    is null. Common on budget Android devices (TECNO, Infinix, Moto G,
 *    Galaxy A-series) with outdated Play Services or stale token caches.
 *    Mitigated by retrying after clearing cached credentials.
 *
 * 2. Native errors (DEVELOPER_ERROR, NETWORK_ERROR, etc.) — signIn()
 *    throws a native exception. DEVELOPER_ERROR (code 10) indicates a
 *    SHA-1 fingerprint mismatch between the app signing key and the
 *    Android OAuth client in GCP Console. The native error code is
 *    preserved in the thrown error message for Sentry visibility.
 */
class GoogleSigninService {
  async signin(): Promise<OidcPayload> {
    if (!GOOGLE_SIGN_IN_ENABLED) throw new Error('Google sign in disabled')

    try {
      // Prompt users with outdated/missing Play Services to update.
      // No-op on iOS. Throws PLAY_SERVICES_NOT_AVAILABLE if unavailable.
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

      const userInfo = await GoogleSignin.signIn()

      if (userInfo.data?.idToken) {
        return { oidcToken: userInfo.data.idToken }
      }

      // idToken is null — attempt recovery by clearing cached credentials.
      // revokeAccess + signOut forces Play Services to fetch a fresh token
      // instead of returning a stale/empty one from cache.
      Logger.warn('Google sign in: empty token received, retrying...')
      await GoogleSignin.revokeAccess().catch(err =>
        Logger.warn('Google sign in: revokeAccess failed during retry', err)
      )
      await GoogleSignin.signOut().catch(err =>
        Logger.warn('Google sign in: signOut failed during retry', err)
      )

      const retryInfo = await GoogleSignin.signIn()
      if (retryInfo.data?.idToken) {
        return { oidcToken: retryInfo.data.idToken }
      }

      Logger.error('Google sign in error: empty token after retry')
      throw new Error('Google sign in error: empty token')
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === statusCodes.SIGN_IN_CANCELLED
      ) {
        throw new Error('USER_CANCELED')
      }
      if (
        error instanceof Error &&
        error.message === 'Google sign in error: empty token'
      ) {
        throw error
      }
      // Preserve the native error code so Sentry captures it
      // (e.g. DEVELOPER_ERROR, NETWORK_ERROR, PLAY_SERVICES_NOT_AVAILABLE).
      // Previously this was wrapped as a generic "Google sign in error"
      // which made it impossible to diagnose the root cause.
      const code = isErrorWithCode(error) ? error.code : 'unknown'
      const message =
        error instanceof Error ? error.message : 'Google sign in error'
      Logger.error(`Google sign in error [code: ${code}]`, error)
      throw new Error(`Google sign in error: ${message} [code: ${code}]`)
    }
  }

  async signOut(): Promise<null> {
    return GoogleSignin.signOut()
  }
}

export default new GoogleSigninService()
