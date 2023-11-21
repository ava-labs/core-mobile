import { SessionStorage, SignerSessionData } from '@cubist-dev/cubesigner-sdk'
import { assertNotUndefined } from 'utils/assertions'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'

export class SeedlessSessionStorage
  implements SessionStorage<SignerSessionData>
{
  async save(data: SignerSessionData): Promise<void> {
    await SecureStorageService.store(KeySlot.SignerSessionData, data)
  }

  async retrieve(): Promise<SignerSessionData> {
    const signerSessionData =
      await SecureStorageService.load<SignerSessionData>(
        KeySlot.SignerSessionData
      )
    assertNotUndefined(signerSessionData)
    return signerSessionData
  }
}
