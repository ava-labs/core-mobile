import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';

export default {
  getMnemonicValet: (mnemonic: string): Promise<MnemonicWallet> => {
    return new Promise<MnemonicWallet>((resolve, reject) => {
      try {
        resolve(MnemonicWallet.fromMnemonic(mnemonic));
      } catch (e) {
        reject(e);
      }
    });
  },
  newMnemonicWallet(): MnemonicWallet {
    return MnemonicWallet.create();
  },
  testMnemonic(): string {
    //fixme: delete this when saving mnemonic is implemented
    return 'capable maze trophy install grunt close left visa cheap tilt elder end mosquito culture south stool baby animal donate creek outer learn kitten tonight';
  },
};
