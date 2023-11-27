import { useState } from 'react'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

type RegisterProps = {
  oidcToken: string
  onRegisterMfaMethods: () => void
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
          const mfa = await SeedlessService.userMfa()

          if (mfa && mfa.length > 0) {
            onVerifyMfaMethod(signResponse.mfaId())
          } else {
            onRegisterMfaMethods()
          }
        } else {
          // TODO: handle ALREADY_REGISTERED without mfa
        }
      } else if (result === SeedlessUserRegistrationResult.APPROVED) {
        if (isMfaRequired) {
          onRegisterMfaMethods()
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
