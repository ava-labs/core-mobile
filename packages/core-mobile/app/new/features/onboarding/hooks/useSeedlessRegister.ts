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
import { showSnackbar } from 'new/common/utils/toast'
import { useLogoModal } from 'common/hooks/useLogoModal'

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
  onAccountVerified: () => void
}

type VerifyProps = {
  mfa: MFA
  oidcAuth: {
    oidcToken: string
    mfaId: string
  }
  onAccountVerified: (mfaType: 'totp' | 'fido') => void
}

type ReturnType = {
  isRegistering: boolean
  register: ({
    getOidcToken,
    oidcProvider,
    onRegisterMfaMethods,
    onVerifyMfaMethod,
    onAccountVerified
  }: RegisterProps) => Promise<void>
  verify: ({ mfa, oidcAuth, onAccountVerified }: VerifyProps) => Promise<void>
}

export const useSeedlessRegister = (): ReturnType => {
  const { showLogoModal, hideLogoModal } = useLogoModal()
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

  const register = async ({
    getOidcToken,
    oidcProvider,
    onRegisterMfaMethods,
    onVerifyMfaMethod,
    onAccountVerified
  }: // eslint-disable-next-line sonarjs/cognitive-complexity
  RegisterProps): Promise<void> => {
    setIsRegistering(true)

    try {
      const { oidcToken } = await getOidcToken()
      const identity = await SeedlessService.session.oidcProveIdentity(
        oidcToken
      )
      const result = await CoreSeedlessAPIService.register(identity)
      const signResponse = await SeedlessService.session.requestOidcAuth(
        oidcToken
      )
      const isMfaRequired = signResponse.requiresMfa()

      // persist email and provider for later use with refresh token flow
      // email is always the same on the cubist's side
      // even if user changes it in the provider, it doesn't change
      await SecureStorageService.store(KeySlot.OidcUserId, identity.email)
      await SecureStorageService.store(KeySlot.OidcProvider, oidcProvider)

      const mfaId = signResponse.mfaId()

      if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
        if (isMfaRequired && mfaId) {
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
          onAccountVerified()
          AnalyticsService.capture('SeedlessSignIn', {
            oidcProvider: oidcProvider
          })
        }
      } else if (result === SeedlessUserRegistrationResult.APPROVED) {
        if (isMfaRequired && mfaId) {
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

  const verify = async ({
    mfa,
    oidcAuth,
    onAccountVerified
  }: VerifyProps): Promise<void> => {
    if (mfa.type === 'totp') {
      if (isSeedlessMfaAuthenticatorBlocked) {
        showSnackbar('Authenticator is not available at the moment')
      } else {
        onAccountVerified(mfa.type)
      }
    } else if (mfa.type === 'fido') {
      if (PasskeyService.isSupported === false) {
        showSnackbar('Passkey/Yubikey is not supported on this device')
        return
      }

      if (isSeedlessMfaPasskeyBlocked && isSeedlessMfaYubikeyBlocked) {
        showSnackbar('AuthenPasskey/Yubikey is not available at the moment')
      }

      showLogoModal()

      try {
        await SeedlessService.session.approveFido(
          oidcAuth.oidcToken,
          oidcAuth.mfaId,
          true
        )

        AnalyticsService.capture('SeedlessMfaVerified', { type: 'Fido' })
        hideLogoModal()
        onAccountVerified(mfa.type)
      } catch (e) {
        hideLogoModal()
        Logger.error('passkey authentication failed', e)
        showSnackbar('Unable to authenticate')
      }
    }
  }

  return {
    isRegistering,
    register,
    verify
  }
}
