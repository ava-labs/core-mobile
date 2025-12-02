import { UR } from '@ngraveio/bc-ur'
import KeystoneSDK from '@keystonehq/keystone-sdk'
import { bip32 } from 'utils/bip32'
import { KeystoneDataStorage } from 'features/keystone/storage/KeystoneDataStorage'
import { ExtendedPublicKey } from 'services/ledger/types'

class KeystoneService {
  private walletInfo = {
    evm: '',
    xp: '',
    mfp: '',
    extendedPublicKeys: [] as ExtendedPublicKey[]
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
    this.walletInfo.extendedPublicKeys =
      accounts.keys
        .filter(key => key.chain === 'AVAX')
        .map(key => ({
          path: key.path,
          key: bip32
            .fromPublicKey(
              Buffer.from(key.publicKey, 'hex'),
              Buffer.from(key.chainCode, 'hex')
            )
            .toBase58(),
          chainCode: key.chainCode
        })) ?? []
  }

  async save(): Promise<void> {
    await KeystoneDataStorage.save(this.walletInfo)
  }
}

export default new KeystoneService()
