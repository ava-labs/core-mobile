import {MnemonicWallet, setNetwork, Utils} from '../wallet_sdk';
import {NetworkConfig} from '../wallet_sdk/Network/types';
export default {
  setNetwork: function (config: NetworkConfig): void {
    setNetwork(config);
  },
  getAvaxPrice: function (): Promise<number> {
    return Utils.getAvaxPrice();
  },
  getMnemonicValet: function (mnemonic: string): MnemonicWallet {
    return MnemonicWallet.fromMnemonic(mnemonic);
  },
};
