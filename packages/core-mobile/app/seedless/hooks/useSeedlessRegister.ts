import { useState } from 'react'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

type RegisterProps = {
  oidcToken: string
  onRegisterMfaMethods: (mfaId: string) => void
  onVerifyMfaMethod: (mfaId: string) => void
}

type ReturnType = {
  isRegistering: boolean
  register: ({
    oidcToken,
    onRegisterMfaMethods,
    onVerifyMfaMethod
  }: RegisterProps) => Promise<void>
}

export const useSeedlessRegister = (): ReturnType => {
  const [isRegistering, setIsRegistering] = useState(false)

  const register = async ({
    oidcToken,
    onRegisterMfaMethods,
    onVerifyMfaMethod
  }: RegisterProps): Promise<void> => {
    setIsRegistering(true)

    try {
      const identity = await SeedlessService.oidcProveIdentity(oidcToken)
      const result = await CoreSeedlessAPIService.register(identity)
      const signResponse = await SeedlessService.login(oidcToken)
      const isMfaRequired = signResponse.requiresMfa()

      if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
        if (isMfaRequired) {
          const mfaId = signResponse.mfaId()
          const mfa = await SeedlessService.userMfa()

          if (mfa && mfa.length > 0) {
            onVerifyMfaMethod(mfaId)
          } else {
            onRegisterMfaMethods(mfaId)
          }
        } else {
          // TODO: handle ALREADY_REGISTERED without mfa
        }
      } else if (result === SeedlessUserRegistrationResult.APPROVED) {
        if (isMfaRequired) {
          const mfaId = signResponse.mfaId()
          onRegisterMfaMethods(mfaId)
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
