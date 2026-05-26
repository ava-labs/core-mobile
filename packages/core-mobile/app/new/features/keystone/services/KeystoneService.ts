import { UR } from '@ngraveio/bc-ur'
import KeystoneSDK from '@keystonehq/keystone-sdk'
import { extendedPublicKeyToXpub } from 'utils/bip32'
import {
  KeystoneDataStorage,
  KeystoneDataStorageType
} from 'features/keystone/storage/KeystoneDataStorage'

class KeystoneService {
  private walletInfo: KeystoneDataStorageType = {
    evm: '',
    xpByAccount: {},
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
    // Onboarding QR delivers the account-0 AVAX xpub at m/44'/9000'/0'.
    // Additional accounts must be fetched on demand via addAccountXpub.
    this.walletInfo.xpByAccount = {
      0: extendedPublicKeyToXpub(avaxAccount.publicKey, avaxAccount.chainCode)
    }
    this.walletInfo.mfp = mfp
  }

  async save(): Promise<void> {
    await KeystoneDataStorage.save(this.walletInfo)
  }

  /**
   * Add the AVAX xpub for a specific account index. Used by the on-demand
   * `generateKeyDerivationCall` QR flow when the user enables a non-primary
   * account.
   */
  async addAccountXpub(accountIndex: number, xpub: string): Promise<void> {
    const existing = await KeystoneDataStorage.retrieve()
    const updated: KeystoneDataStorageType = {
      ...existing,
      xpByAccount: {
        ...existing.xpByAccount,
        [accountIndex]: xpub
      }
    }
    await KeystoneDataStorage.save(updated)
    this.walletInfo = updated
  }
}

export default new KeystoneService()
