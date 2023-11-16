import { useState } from 'react'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'

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

    const result = await CoreSeedlessAPIService.register(oidcToken)

    if (result !== SeedlessUserRegistrationResult.ERROR) {
      await SeedlessService.login(oidcToken)
    }

    setIsRegistering(false)
    return result
  }

  return {
    isRegistering,
    register
  }
}
