import { useState } from 'react'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { OidcProviders } from 'seedless/consts'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'
import { MFA, OidcPayload } from 'seedless/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'

type RegisterProps = {
  getOidcToken: () => Promise<OidcPayload>
  oidcProvider: OidcProviders
  onRegisterMfaMethods: (oidcToken: string, mfaId: string) => void
  onVerifyMfaMethod: (
    oidcToken: string,
    mfaId: string,
    mfaMethods: MFA[]
  ) => void
}

type ReturnType = {
  isRegistering: boolean
  register: ({
    getOidcToken,
    oidcProvider,
    onRegisterMfaMethods,
    onVerifyMfaMethod
  }: RegisterProps) => Promise<void>
}

export const useSeedlessRegister = (): ReturnType => {
  const [isRegistering, setIsRegistering] = useState(false)

  const register = async ({
    getOidcToken,
    oidcProvider,
    onRegisterMfaMethods,
    onVerifyMfaMethod
  }: RegisterProps): Promise<void> => {
    setIsRegistering(true)

    try {
      const { oidcToken } = await getOidcToken()
      const identity = await SeedlessService.sessionManager.oidcProveIdentity(
        oidcToken
      )
      const result = await CoreSeedlessAPIService.register(identity)
      const signResponse = await SeedlessService.sessionManager.requestOidcAuth(
        oidcToken
      )
      const isMfaRequired = signResponse.requiresMfa()

      // persist email and provider for later use with refresh token flow
      // email is always the same on the cubist's side
      // even if user changes it in the provider, it doesn't change
      await SecureStorageService.store(KeySlot.OidcUserId, identity.email)
      await SecureStorageService.store(KeySlot.OidcProvider, oidcProvider)

      if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
        if (isMfaRequired) {
          const mfaId = signResponse.mfaId()
          const mfaMethods = identity.user_info?.configured_mfa

          if (mfaMethods && mfaMethods.length > 0) {
            onVerifyMfaMethod(oidcToken, mfaId, mfaMethods)
            AnalyticsService.capture('SeedlessSignIn', {
              oidcProvider: oidcProvider
            })
          } else {
            onRegisterMfaMethods(oidcToken, mfaId)
            AnalyticsService.capture('SeedlessSignUp', {
              oidcProvider: oidcProvider
            })
          }
        } else {
          // TODO: handle ALREADY_REGISTERED without mfa
        }
      } else if (result === SeedlessUserRegistrationResult.APPROVED) {
        if (isMfaRequired) {
          const mfaId = signResponse.mfaId()
          onRegisterMfaMethods(oidcToken, mfaId)
          AnalyticsService.capture('SeedlessSignUp', {
            oidcProvider: oidcProvider
          })
        } else {
          // TODO: handle APPROVED without mfa
        }
      } else {
        throw new Error(SeedlessUserRegistrationResult.ERROR)
      }
    } catch (error) {
      AnalyticsService.capture('SeedlessLoginFailed')
      Logger.error('useSeedlessRegister error', error)
      throw new Error(SeedlessUserRegistrationResult.ERROR)
    } finally {
      setIsRegistering(false)
    }
  }

  return {
    isRegistering,
    register
  }
}
