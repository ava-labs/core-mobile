import {MnemonicWallet} from '../../wallet_sdk'
import WalletSDK from '../WalletSDK'


export default class {
  private wallet: MnemonicWallet = WalletSDK.newMnemonicWallet()
  mnemonic: string = this.wallet.mnemonic
}
