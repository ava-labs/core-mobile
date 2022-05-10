import { MnemonicWallet } from '@avalabs/avalanche-wallet-sdk'
import Config from 'react-native-config'

export default {
  async generateMnemonic(): Promise<string> {
    try {
      return Promise.resolve(MnemonicWallet.generateMnemonicPhrase())
    } catch (e) {
      return Promise.reject(e)
    }
  },

  testMnemonic(): string {
    return Config.TEST_MNEMONIC
  }
}
