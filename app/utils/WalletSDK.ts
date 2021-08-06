import {NetworkConfig} from '@avalabs/avalanche-wallet-sdk/dist/Network/types';
import {
  MnemonicWallet,
  Network,
  SingletonWallet,
  Utils,
} from '@avalabs/avalanche-wallet-sdk';

export default {
  setNetwork: (config: NetworkConfig): void => {
    Network.setNetwork(config);
  },
  getAvaxPrice: (): Promise<number> => {
    return Utils.getAvaxPrice();
  },
  getSingletonWallet: (privateKey: string): SingletonWallet => {
    return SingletonWallet.fromPrivateKey(privateKey);
  },
  getMnemonicValet: (mnemonic: string): MnemonicWallet => {
    return MnemonicWallet.fromMnemonic(mnemonic);
  },
  newMnemonicWallet(): MnemonicWallet {
    return MnemonicWallet.create();
  },
  testMnemonic(): string {
    //fixme: delete this when saving mnemonic is implemented
    return 'capable maze trophy install grunt close left visa cheap tilt elder end mosquito culture south stool baby animal donate creek outer learn kitten tonight';
  },
};
