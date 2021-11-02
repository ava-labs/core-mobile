import {useEffect, useState} from 'react';
import BiometricsSDK from 'utils/BiometricsSDK';
import {BIOMETRY_TYPE} from 'react-native-keychain';

export function useBiometricLogin(
  m: string,
  isDarkMode: boolean,
): [string, () => Promise<boolean>, any] {
  const [mnemonic] = useState(m);
  const [biometryType, setBiometryType] = useState<string>('');
  const [fingerprintIcon, setFingerprintIcon] = useState<any>();

  useEffect(() => {
    BiometricsSDK.getBiometryType().then(value => {
      setBiometryType(value?.toString() ?? '');
    });
  }, []);

  useEffect(() => {
    switch (biometryType) {
      case BIOMETRY_TYPE.FINGERPRINT:
      case BIOMETRY_TYPE.TOUCH_ID:
        setFingerprintIcon(
          isDarkMode
            ? require('assets/icons/fingerprint_dark.png')
            : require('assets/icons/fingerprint_light.png'),
        );
        break;
      case BIOMETRY_TYPE.FACE:
      case BIOMETRY_TYPE.FACE_ID:
        setFingerprintIcon(
          isDarkMode
            ? require('assets/icons/face_id_dark.png')
            : require('assets/icons/face_id_light.png'),
        );
        break;
      case BIOMETRY_TYPE.IRIS:
        setFingerprintIcon(
          isDarkMode
            ? require('assets/icons/face_id_dark.png')
            : require('assets/icons/face_id_light.png'),
        );
        //todo add correct icon
        break;
    }
  }, [biometryType]);

  const onUseBiometry = () => {
    return BiometricsSDK.storeWalletWithBiometry(mnemonic);
  };

  return [biometryType, onUseBiometry, fingerprintIcon];
}
