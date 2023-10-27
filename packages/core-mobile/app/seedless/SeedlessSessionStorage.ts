import { SessionStorage, SignerSessionData } from '@cubist-dev/cubesigner-sdk'
import StorageTools from 'repository/StorageTools'

const SEEDLESS_TOKEN_STORAGE_KEY = 'SEEDLESS_TOKEN_STORAGE'

export class SeedlessTokenStorage implements SessionStorage<SignerSessionData> {
  async save(data: SignerSessionData): Promise<void> {
    // Seedless Todo: can we use AsyncStorage here to store the token?
    StorageTools.saveToStorage(SEEDLESS_TOKEN_STORAGE_KEY, data)
  }

  async retrieve(): Promise<SignerSessionData> {
    const data = await StorageTools.loadFromStorageAsObj<SignerSessionData>(
      SEEDLESS_TOKEN_STORAGE_KEY
    )

    if (!data) {
      throw new Error('Seedless auth token not found')
    }

    return data
  }
}
