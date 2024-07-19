import { AnalyticsServiceInterface } from 'services/analytics/types'

export class AnalyticsServiceNoop implements AnalyticsServiceInterface {
  setEnabled(): void {
    //noop
  }

  async capture(): Promise<void> {
    //noop
  }

  async captureWithEncryption(): Promise<void> {
    //noop
  }
}
