import { useState } from 'react'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

type ReturnType = {
  isRegistering: boolean
  register: (oidcToken: string) => Promise<SeedlessUserRegistrationResult>
}

export const useSeedlessRegister = (): ReturnType => {
  const [isRegistering, setIsRegistering] = useState(false)

  const register = async (
    oidcToken: string
  ): Promise<SeedlessUserRegistrationResult> => {
    setIsRegistering(true)

    try {
      const result = await CoreSeedlessAPIService.register(oidcToken)
      if (result !== SeedlessUserRegistrationResult.ERROR) {
        await SeedlessService.login(oidcToken)
      }
      return result
    } catch (error) {
      Logger.error('useSeedlessRegister error', error)
      return SeedlessUserRegistrationResult.ERROR
    } finally {
      setIsRegistering(false)
    }
  }

  return {
    isRegistering,
    register
  }
}
