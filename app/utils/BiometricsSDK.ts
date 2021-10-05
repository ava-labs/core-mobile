import Keychain, {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  getAllGenericPasswordServices,
  getSupportedBiometryType,
  Options,
  Result,
  SECURITY_RULES,
  UserCredentials,
} from 'react-native-keychain';
import {from, Observable} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SECURE_ACCESS_SET} from 'resources/Constants';

const SERVICE_KEY = 'sec-storage-service';

export default class BiometricsSDK {
  static KEYSTORE_PASSCODE_OPTIONS: Options = {
    accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    service: SERVICE_KEY,
  };

  static KEYSTORE_OPTIONS: Options = {
    accessControl:
      Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    service: SERVICE_KEY,
  };

  static storeWalletWithPin = (
    pin: string,
    walletMnemonic: string,
  ): Promise<false | Result> => {
    AsyncStorage.setItem(SECURE_ACCESS_SET, 'PIN');
    return Keychain.setGenericPassword(
      pin,
      walletMnemonic,
      BiometricsSDK.KEYSTORE_PASSCODE_OPTIONS,
    );
  };
  static loadWalletWithPin = (): Promise<false | UserCredentials> => {
    return Keychain.getGenericPassword(BiometricsSDK.KEYSTORE_PASSCODE_OPTIONS);
  };

  /**
   * Stores key under available biometry and prompts user for biometry to check if everytinih is ok.
   * Emits boolean true if everything ok, or throws Error if something whent wrong.
   * @param key - mnemonic to store
   */
  static storeWalletWithBiometry(key: string): Observable<boolean> {
    AsyncStorage.setItem(SECURE_ACCESS_SET, 'BIO');
    return from(BiometricsSDK.saveWalletKey(key)).pipe(
      switchMap(credentials => {
        if (credentials === false) {
          throw Error('Error saving mnemonic');
        }
        return BiometricsSDK.loadWalletKey(BiometricsSDK.KEYSTORE_OPTIONS);
      }),
      map(credentials => {
        if (credentials === false) {
          throw Error('Error saving mnemonic');
        }
        return true;
      }),
      catchError((err: Error) => {
        return from(BiometricsSDK.clearWalletKey()).pipe(
          tap(() => {
            throw err;
          }),
        );
      }),
    );
  }

  static saveWalletKey = (key: string): Promise<false | Result> => {
    return Keychain.setGenericPassword(
      'wallet',
      key,
      BiometricsSDK.KEYSTORE_OPTIONS,
    );
  };

  static loadWalletKey = (
    options: Options,
  ): Promise<false | UserCredentials> => {
    return Keychain.getGenericPassword(options);
  };

  static clearWalletKey = (): Promise<boolean> => {
    return Keychain.resetGenericPassword(BiometricsSDK.KEYSTORE_PASSCODE_OPTIONS).then(
      () => Keychain.resetGenericPassword(BiometricsSDK.KEYSTORE_OPTIONS),
    );
  };

  static canUseBiometry = (): Promise<boolean> => {
    return getSupportedBiometryType().then(value => {
      return value !== null;
    });
  };

  static getBiometryType = (): Promise<string> => {
    return getSupportedBiometryType().then(value => {
      console.log(value);
      return value as string;
    });
  };

  static hasWalletStored = (): Promise<boolean> => {
    return getAllGenericPasswordServices().then(value => {
      return value.length !== 0;
    });
  };
}
