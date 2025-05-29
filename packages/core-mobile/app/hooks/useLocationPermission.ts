import { PermissionStatus, useForegroundPermissions } from 'expo-location'
import { useCallback, useEffect } from 'react'

export const useLocationPermission = (): {
  granted: boolean
} => {
  const [permission, requestPermission] = useForegroundPermissions()

  const checkLocationPermission = useCallback(async () => {
    if (
      permission &&
      (permission.granted === false ||
        permission.status === PermissionStatus.UNDETERMINED)
    ) {
      requestPermission()
    }
  }, [permission, requestPermission])

  useEffect(() => {
    checkLocationPermission()
  }, [checkLocationPermission])

  return {
    granted: permission?.granted ?? false
  }
}
