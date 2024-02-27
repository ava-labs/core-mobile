import { showSimpleToast } from 'components/Snackbar'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { OidcProviders } from 'seedless/consts'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'
import { MFA, OidcPayload } from 'seedless/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  selectIsSeedlessMfaAuthenticatorBlocked,
  selectIsSeedlessMfaPasskeyBlocked,
  selectIsSeedlessMfaYubikeyBlocked
} from 'store/posthog'
import Logger from 'utils/Logger'
import PasskeyService from 'services/passkey/PasskeyService'
import { hideOwl, showOwl } from 'components/GlobalOwlLoader'
import useVerifyMFA from './useVerifyMFA'

type RegisterProps = {
  getOidcToken: () => Promise<OidcPayload>
  oidcProvider: OidcProviders
  onRegisterMfaMethods: (oidcAuth?: {
    oidcToken: string
    mfaId: string
  }) => void
  onVerifyMfaMethod: (
    oidcAuth: { oidcToken: string; mfaId: string },
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
  verify: (
    mfa: MFA,
    oidcAuth: {
      oidcToken: string
      mfaId: string
    },
    onAccountVerified: () => void
  ) => Promise<void>
}

export const useSeedlessRegister = (): ReturnType => {
  const [isRegistering, setIsRegistering] = useState(false)

  const isSeedlessMfaAuthenticatorBlocked = useSelector(
    selectIsSeedlessMfaAuthenticatorBlocked
  )
  const isSeedlessMfaPasskeyBlocked = useSelector(
    selectIsSeedlessMfaPasskeyBlocked
  )
  const isSeedlessMfaYubikeyBlocked = useSelector(
    selectIsSeedlessMfaYubikeyBlocked
  )
  const { verifyTotp } = useVerifyMFA(SeedlessService.sessionManager)

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
            onVerifyMfaMethod({ oidcToken, mfaId }, mfaMethods)
            AnalyticsService.capture('SeedlessSignIn', {
              oidcProvider: oidcProvider
            })
          } else {
            onRegisterMfaMethods({ oidcToken, mfaId })
            AnalyticsService.capture('SeedlessSignUp', {
              oidcProvider: oidcProvider
            })
          }
        } else {
          onRegisterMfaMethods()
          AnalyticsService.capture('SeedlessSignIn', {
            oidcProvider: oidcProvider
          })
        }
      } else if (result === SeedlessUserRegistrationResult.APPROVED) {
        if (isMfaRequired) {
          const mfaId = signResponse.mfaId()
          onRegisterMfaMethods({ oidcToken, mfaId })
          AnalyticsService.capture('SeedlessSignUp', {
            oidcProvider: oidcProvider
          })
        } else {
          onRegisterMfaMethods()
          AnalyticsService.capture('SeedlessSignUp', {
            oidcProvider: oidcProvider
          })
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

  const verify = async (
    mfa: MFA,
    oidcAuth: {
      oidcToken: string
      mfaId: string
    },
    onAccountVerified: () => void
  ): Promise<void> => {
    if (mfa.type === 'totp') {
      if (isSeedlessMfaAuthenticatorBlocked) {
        showSimpleToast('Authenticator is not available at the moment')
      } else {
        verifyTotp({
          onVerifyCode: code =>
            SeedlessService.sessionManager.verifyCode(
              oidcAuth.oidcToken,
              oidcAuth.mfaId,
              code
            ),
          onVerifySuccess: () => {
            onAccountVerified()
            AnalyticsService.capture('SeedlessMfaVerified', {
              type: 'Authenticator'
            })
          }
        })
      }
    } else if (mfa.type === 'fido') {
      if (PasskeyService.isSupported === false) {
        showSimpleToast('Passkey/Yubikey is not supported on this device')
        return
      }

      if (isSeedlessMfaPasskeyBlocked && isSeedlessMfaYubikeyBlocked) {
        showSimpleToast('AuthenPasskey/Yubikey is not available at the moment')
      }

      showOwl()

      try {
        await SeedlessService.sessionManager.approveFido(
          oidcAuth.oidcToken,
          oidcAuth.mfaId,
          false
        )

        AnalyticsService.capture('SeedlessMfaVerified', { type: 'Fido' })

        onAccountVerified()
      } catch (e) {
        Logger.error('passkey authentication failed', e)
        showSimpleToast('Unable to authenticate')
      } finally {
        hideOwl()
      }
    }
  }

  return {
    isRegistering,
    register,
    verify
  }
}
