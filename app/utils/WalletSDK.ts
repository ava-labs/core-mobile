import Config from 'react-native-config'
import { entropyToMnemonic } from 'ethers/lib/utils'

export default {
  async generateMnemonic(): Promise<string> {
    try {
      // @ts-ignore added shim by react-native-get-random-values
      const randomBytes = global.crypto.getRandomValues(new Uint8Array(32))
      return entropyToMnemonic(randomBytes)
    } catch (e) {
      return Promise.reject(e)
    }
  },

  testMnemonic(): string {
    return Config.TEST_MNEMONIC ?? ''
  }
}
