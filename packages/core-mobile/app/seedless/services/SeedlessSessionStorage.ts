import { SessionStorage, SignerSessionData } from '@cubist-dev/cubesigner-sdk'
import { assertNotUndefined } from 'utils/assertions'
import SecurityService, { KeySlot } from 'security/SecurityService'

export class SeedlessSessionStorage
  implements SessionStorage<SignerSessionData>
{
  async save(data: SignerSessionData): Promise<void> {
    await SecurityService.store(KeySlot.SeedlessSessionStorage, data)
  }

  async retrieve(): Promise<SignerSessionData> {
    const signerSessionData = await SecurityService.load<SignerSessionData>(
      KeySlot.SeedlessSessionStorage
    )
    assertNotUndefined(signerSessionData)
    return signerSessionData
  }
}
