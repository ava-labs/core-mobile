import { useState } from 'react'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { OidcProviders } from 'seedless/consts'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'
import { MFA, OidcPayload } from 'seedless/types'
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
      await SecureStorageService.store(KeySlot.OidcProvider, oidcProvider)
      const { oidcToken } = await getOidcToken()
      const identity = await SeedlessService.oidcProveIdentity(oidcToken)
      const result = await CoreSeedlessAPIService.register(identity)
      const signResponse = await SeedlessService.requestOidcAuth(oidcToken)
      const isMfaRequired = signResponse.requiresMfa()

      if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
        if (isMfaRequired) {
          const mfaId = signResponse.mfaId()
          const mfaMethods = identity.user_info?.configured_mfa

          if (mfaMethods && mfaMethods.length > 0) {
            onVerifyMfaMethod(oidcToken, mfaId, mfaMethods)
          } else {
            onRegisterMfaMethods(oidcToken, mfaId)
          }
        } else {
          // TODO: handle ALREADY_REGISTERED without mfa
        }
      } else if (result === SeedlessUserRegistrationResult.APPROVED) {
        if (isMfaRequired) {
          const mfaId = signResponse.mfaId()
          onRegisterMfaMethods(oidcToken, mfaId)
        } else {
          // TODO: handle APPROVED without mfa
        }
      } else {
        throw new Error(SeedlessUserRegistrationResult.ERROR)
      }
    } catch (error) {
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
