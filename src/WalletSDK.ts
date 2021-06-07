import {MnemonicWallet, Network, Utils} from '../wallet_sdk';
import {NetworkConfig} from '../wallet_sdk/Network/types';
export default {
  setNetwork: (config: NetworkConfig): void => {
    Network.setNetwork(config);
  },
  getAvaxPrice: (): Promise<number> => {
    return Utils.getAvaxPrice();
  },
  getMnemonicValet: (mnemonic: string): MnemonicWallet => {
    return MnemonicWallet.fromMnemonic(mnemonic);
  }
};
