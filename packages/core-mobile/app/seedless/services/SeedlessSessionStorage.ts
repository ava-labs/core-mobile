import { SessionStorage, SignerSessionData } from '@cubist-dev/cubesigner-sdk'
import { assertNotUndefined } from 'utils/assertions'

// TODO: This is a stub. It should be implemented.
export class SeedlessTokenStorage implements SessionStorage<SignerSessionData> {
  #data: SignerSessionData | undefined

  async save(data: SignerSessionData): Promise<void> {
    this.#data = data
  }

  async retrieve(): Promise<SignerSessionData> {
    assertNotUndefined(this.#data)
    return this.#data
  }
}
