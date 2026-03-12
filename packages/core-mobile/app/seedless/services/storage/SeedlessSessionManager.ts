import {
  ExclusiveSessionManager,
  SessionData
} from '@cubist-labs/cubesigner-sdk'
import { assertNotUndefined } from 'utils/assertions'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import Logger from 'utils/Logger'

export class SeedlessSessionManager extends ExclusiveSessionManager {
  async store(data: SessionData): Promise<void> {
    try {
      await SecureStorageService.store(KeySlot.SignerSessionData, data)
    } catch (error) {
      Logger.error(
        `[SeedlessSessionManager] store() FAILED - session data NOT persisted (epoch: ${
          data.session_info?.epoch ?? 'unknown'
        })`,
        error
      )
      throw error
    }
  }

  async retrieve(): Promise<SessionData> {
    try {
      const signerSessionData = await SecureStorageService.load<SessionData>(
        KeySlot.SignerSessionData
      )
      assertNotUndefined(signerSessionData, 'no signer session data found')
      return signerSessionData
    } catch (error) {
      Logger.error(
        `[SeedlessSessionManager] retrieve() FAILED - no session data in keychain`,
        error
      )
      throw error
    }
  }
}
