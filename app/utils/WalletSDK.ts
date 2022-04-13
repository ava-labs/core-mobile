import { MnemonicWallet } from '@avalabs/avalanche-wallet-sdk'

export default {
  async generateMnemonic(): Promise<string> {
    try {
      return Promise.resolve(MnemonicWallet.generateMnemonicPhrase())
    } catch (e) {
      return Promise.reject(e)
    }
  },

  testMnemonic(): string {
    //fixme: delete this when saving mnemonic is implemented
    return 'capable maze trophy install grunt close left visa cheap tilt elder end mosquito culture south stool baby animal donate creek outer learn kitten tonight'
  }
}
