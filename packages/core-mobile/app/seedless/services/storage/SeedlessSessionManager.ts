import {
  ExclusiveSessionManager,
  SessionData
} from '@cubist-labs/cubesigner-sdk'
import { assertNotUndefined } from 'utils/assertions'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'

export class SeedlessSessionManager extends ExclusiveSessionManager {
  async store(data: SessionData): Promise<void> {
    await SecureStorageService.store(KeySlot.SignerSessionData, data)
  }

  async retrieve(): Promise<SessionData> {
    const signerSessionData = await SecureStorageService.load<SessionData>(
      KeySlot.SignerSessionData
    )
    assertNotUndefined(signerSessionData, 'no signer session data found')
    return signerSessionData
  }
}
