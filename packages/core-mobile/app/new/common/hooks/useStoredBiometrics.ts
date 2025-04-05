import { useEffect, useState } from 'react'
import { StorageKey } from 'resources/Constants'
import DeviceInfoService, {
  BiometricType
} from 'services/deviceInfo/DeviceInfoService'
import Logger from 'utils/Logger'
import { commonStorage } from 'utils/mmkv'

export const useStoredBiometrics = (): {
  useBiometrics: boolean
  setUseBiometrics: React.Dispatch<React.SetStateAction<boolean>>
  isBiometricAvailable: boolean
} => {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false)
  const [useBiometrics, setUseBiometrics] = useState(true)

  useEffect(() => {
    DeviceInfoService.getBiometricType()
      .then((bioType: BiometricType) => {
        setIsBiometricAvailable(bioType !== BiometricType.NONE)
      })
      .catch(Logger.error)

    const type = commonStorage.getString(StorageKey.SECURE_ACCESS_SET)
    if (type) {
      setUseBiometrics(type === 'BIO')
    } else {
      Logger.error('Secure access type not found')
    }
  }, [])

  return { useBiometrics, setUseBiometrics, isBiometricAvailable }
}
