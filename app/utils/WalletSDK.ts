import Config from 'react-native-config'
import { entropyToMnemonic } from 'ethers/lib/utils'
import Crypto from 'react-native-quick-crypto'

export default {
  async generateMnemonic(): Promise<string> {
    try {
      const randomBytes = Crypto.getRandomValues(new Uint8Array(32))
      return entropyToMnemonic(randomBytes)
    } catch (e) {
      return Promise.reject(e)
    }
  },

  testMnemonic(): string {
    return Config.TEST_MNEMONIC ?? ''
  }
}
