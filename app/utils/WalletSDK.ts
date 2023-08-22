import Config from 'react-native-config'
import { Mnemonic } from 'ethers'
import Crypto from 'react-native-quick-crypto'

export default {
  async generateMnemonic(): Promise<string> {
    try {
      const randomBytes = Crypto.getRandomValues(new Uint8Array(32))
      return Mnemonic.fromEntropy(Uint8Array.from(randomBytes)).phrase
    } catch (e) {
      return Promise.reject(e)
    }
  },

  testMnemonic(): string {
    return Config.TEST_MNEMONIC ?? ''
  }
}
