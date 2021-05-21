import { AllKeyFileDecryptedTypes, AllKeyFileTypes, KeyFileV6 } from './types';
import MnemonicWallet from "../Wallet/MnemonicWallet";
import SingletonWallet from "../Wallet/SingletonWallet";
import { AccessWalletMultipleInput } from './types';
/**
 * Will decrypt and return the keys of the encrypted wallets in the given json file
 * @param data A JSON file of encrypted wallet keys
 * @param pass The password to decrypt the keys
 */
declare function readKeyFile(data: AllKeyFileTypes, pass: string): Promise<AllKeyFileDecryptedTypes>;
declare function extractKeysFromDecryptedFile(file: AllKeyFileDecryptedTypes): AccessWalletMultipleInput[];
/**
 * Given an array of wallets, the active index, and a password, return an encrypted JSON object that is the keystore file
 * @param wallets An array of wallet to encrypt
 * @param pass Password used in encryption
 * @param activeIndex Index of the active wallet in the `wallets` array
 * @return Returns a JSON object that can later be decrypted with `readKeyfile` and the given password
 */
declare function makeKeyfile(wallets: (MnemonicWallet | SingletonWallet)[], pass: string, activeIndex: number): Promise<KeyFileV6>;
declare const _default: {
    readKeyFile: typeof readKeyFile;
    makeKeyfile: typeof makeKeyfile;
    KEYSTORE_VERSION: string;
    extractKeysFromDecryptedFile: typeof extractKeysFromDecryptedFile;
};
export default _default;
