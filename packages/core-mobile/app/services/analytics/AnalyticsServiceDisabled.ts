export class AnalyticsServiceDisabled {
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
