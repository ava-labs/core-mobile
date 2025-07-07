import {
  KeystoneDataStorage,
  KeystoneDataStorageType
} from '../storage/KeystoneDataStorage'

class KeystoneService {
  private walletInfo = {
    evm: '',
    xp: '',
    mfp: ''
  }

  init({ evm, xp, mfp }: KeystoneDataStorageType): void {
    this.walletInfo.evm = evm
    this.walletInfo.xp = xp
    this.walletInfo.mfp = mfp
  }

  async refreshPublicKeys(): Promise<void> {
    await KeystoneDataStorage.save(this.walletInfo)
  }
}

export default new KeystoneService()
