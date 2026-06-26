import { UR } from '@ngraveio/bc-ur'
import KeystoneSDK from '@keystonehq/keystone-sdk'
import { extendedPublicKeyToXpub } from 'utils/bip32'
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

    this.walletInfo.evm = extendedPublicKeyToXpub(
      ethAccount.publicKey,
      ethAccount.chainCode
    )
    this.walletInfo.xp = extendedPublicKeyToXpub(
      avaxAccount.publicKey,
      avaxAccount.chainCode
    )
    this.walletInfo.mfp = mfp
  }

  async save(): Promise<void> {
    // walletInfo is only populated by init() during the onboarding QR scan and
    // is not rehydrated from storage. On a cold relaunch it is empty, so guard
    // against overwriting the real stored xpubs with empty strings.
    if (!this.walletInfo.evm || !this.walletInfo.xp || !this.walletInfo.mfp) {
      return
    }
    await KeystoneDataStorage.save(this.walletInfo)
  }
}

export default new KeystoneService()
