import { useEffect, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'

/**
 * Returns true when the device has an active internet connection.
 * Starts as true to avoid a false "offline" flash on mount.
 */
export const useNetworkConnectivity = (): boolean => {
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    return NetInfo.addEventListener(state => {
      const online =
        state.isConnected === true && state.isInternetReachable !== false
      setIsConnected(online)
    })
  }, [])

  return isConnected
}
