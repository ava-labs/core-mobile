import { useState } from 'react'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService, { UserMFAs } from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

type RegisterReturnType = {
  result: SeedlessUserRegistrationResult
  isMfaRequired?: boolean
  mfaId?: string
  mfa?: UserMFAs
}

type ReturnType = {
  isRegistering: boolean
  register: (oidcToken: string) => Promise<RegisterReturnType>
}

export const useSeedlessRegister = (): ReturnType => {
  const [isRegistering, setIsRegistering] = useState(false)

  const register = async (oidcToken: string): Promise<RegisterReturnType> => {
    setIsRegistering(true)

    try {
      const identity = await SeedlessService.oidcProveIdentity(oidcToken)
      const result = await CoreSeedlessAPIService.register(identity)
      if (result === SeedlessUserRegistrationResult.ERROR) {
        return { result }
      } else {
        const signResponse = await SeedlessService.login(oidcToken)

        if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
          return {
            result,
            isMfaRequired: signResponse.requiresMfa(),
            mfaId: signResponse.requiresMfa()
              ? signResponse.mfaId()
              : undefined,
            mfa: await SeedlessService.userMfa()
          }
        } else {
          return {
            result: SeedlessUserRegistrationResult.APPROVED,
            isMfaRequired: signResponse.requiresMfa()
          }
        }
      }
    } catch (error) {
      Logger.error('useSeedlessRegister error', error)
      return { result: SeedlessUserRegistrationResult.ERROR }
    } finally {
      setIsRegistering(false)
    }
  }

  return {
    isRegistering,
    register
  }
}
