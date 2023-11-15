import { SessionStorage, SignerSessionData } from '@cubist-dev/cubesigner-sdk'
import { assertNotUndefined } from 'utils/assertions'

let signerSessionData: SignerSessionData | undefined

// TODO: This is a stub. It should be implemented.
export class SeedlessTokenStorage implements SessionStorage<SignerSessionData> {
  async save(data: SignerSessionData): Promise<void> {
    signerSessionData = data
  }

  async retrieve(): Promise<SignerSessionData> {
    assertNotUndefined(signerSessionData)
    return signerSessionData
  }
}
