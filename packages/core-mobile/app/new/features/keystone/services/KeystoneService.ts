import { UR } from '@ngraveio/bc-ur'
import KeystoneSDK from '@keystonehq/keystone-sdk'
import { bip32 } from 'utils/bip32'
import { KeystoneDataStorage } from 'features/keystone/storage/KeystoneDataStorage'

class KeystoneService {
  private walletInfo = {
    evm: '',
    xp: '',
    mfp: ''
  }

  init(ur: UR): void {
    const sdk = new KeystoneSDK()
    const accounts = sdk.parseMultiAccounts(ur)
    const mfp = accounts.masterFingerprint
    const ethAccount = accounts.keys.find(key => key.chain === 'ETH')
    const avaxAccount = accounts.keys.find(key => key.chain === 'AVAX')
    if (!ethAccount || !avaxAccount) {
      throw new Error('No ETH or AVAX account found')
    }

    this.walletInfo.evm = bip32
      .fromPublicKey(
        Buffer.from(ethAccount.publicKey, 'hex'),
        Buffer.from(ethAccount.chainCode, 'hex')
      )
      .toBase58()
    this.walletInfo.xp = bip32
      .fromPublicKey(
        Buffer.from(avaxAccount.publicKey, 'hex'),
        Buffer.from(avaxAccount.chainCode, 'hex')
      )
      .toBase58()
    this.walletInfo.mfp = mfp
  }

  async save(): Promise<void> {
    await KeystoneDataStorage.save(this.walletInfo)
  }
}

export default new KeystoneService()
