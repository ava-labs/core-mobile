import WalletSDK from '../WalletSDK'
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"


export default class {
  private wallet: MnemonicWallet = WalletSDK.newMnemonicWallet()
  mnemonic: string = this.wallet.mnemonic
}
