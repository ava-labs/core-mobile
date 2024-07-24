import { FeatureGates, FeatureVars, PostHogServiceInterface } from './types'

export class PostHogServiceNoop implements PostHogServiceInterface {
  configure(): void {
    //noop
  }

  get isConfigured(): boolean {
    return false
  }

  async capture(): Promise<void> {
    //noop
  }

  async identifyUser(): Promise<void> {
    //noop
  }

  async fetchFeatureFlags(): Promise<
    Partial<Record<FeatureGates | FeatureVars, string | boolean>> | undefined
  > {
    //noop
    return undefined
  }
}
