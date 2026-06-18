let pendingMnemonic: string | null = null
let pendingPrivateKey: string | null = null

export const sensitiveDataStore = {
  setMnemonic: (value: string): void => {
    pendingMnemonic = value
  },
  getMnemonic: (): string | null => {
    const value = pendingMnemonic
    pendingMnemonic = null
    return value
  },
  setPrivateKey: (value: string): void => {
    pendingPrivateKey = value
  },
  getPrivateKey: (): string | null => {
    const value = pendingPrivateKey
    pendingPrivateKey = null
    return value
  }
}
