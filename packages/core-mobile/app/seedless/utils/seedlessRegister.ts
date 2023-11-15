import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'

export const seedlessRegister = async (
  oidcToken: string
): Promise<SeedlessUserRegistrationResult> => {
  const result = await CoreSeedlessAPIService.register(oidcToken)

  if (result !== SeedlessUserRegistrationResult.ERROR) {
    await SeedlessService.login(oidcToken)
  }

  return result
}
