import React, { useState, useEffect, createContext, useContext } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import { Platform } from 'react-native'

export enum BioType {
  FACE_ID = 'Face ID',
  TOUCH_ID = 'Touch ID',
  NONE = 'None'
}

export interface DeviceInfoContextState {
  bioType: BioType
}

export const DeviceInfoContext = createContext<DeviceInfoContextState>(
  {} as DeviceInfoContextState
)

export const DeviceInfoProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const [bioType, setBioType] = useState<BioType>(BioType.NONE)

  useEffect(() => {
    const getBiometryType = async (): Promise<void> => {
      const hasBiometrics = await LocalAuthentication.hasHardwareAsync()
      if (hasBiometrics === undefined) {
        return
      }
      const authenticationTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync()

      if (
        authenticationTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT
        )
      ) {
        setBioType(BioType.TOUCH_ID)
        return
      }

      const hasIosFaceId =
        authenticationTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        ) && Platform.OS === 'ios'
      const hasAndroidFaceId =
        authenticationTypes.length > 0 && Platform.OS === 'android'

      if (hasIosFaceId || hasAndroidFaceId) {
        setBioType(BioType.FACE_ID)
      }
    }
    getBiometryType()
  }, [])

  return (
    <DeviceInfoContext.Provider value={{ bioType }}>
      {children}
    </DeviceInfoContext.Provider>
  )
}

export function useDeviceInfoContext(): DeviceInfoContextState {
  return useContext(DeviceInfoContext)
}
