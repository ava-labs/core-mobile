import { SeedlessUserRegistrationResult } from 'seedless/services/CoreSeedlessAPIService'
import { CoreSeedlessApiInterface } from 'seedless/services/types'

export class CoreSeedlessAPIServiceNoop implements CoreSeedlessApiInterface {
  async register(): Promise<SeedlessUserRegistrationResult> {
    return SeedlessUserRegistrationResult.ERROR
  }

  async addAccount(): Promise<void> {
    //noop
  }

  async deriveMissingKeys(): Promise<void> {
    //noop
  }
}
