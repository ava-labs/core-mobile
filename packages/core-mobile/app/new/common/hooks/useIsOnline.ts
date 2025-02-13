import { useEffect, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'

export const useIsOnline = (): boolean => {
  const [isOnline, setIsOnline] = useState(false)

  // manage online status
  useEffect(() => {
    return NetInfo.addEventListener(state => {
      const online =
        state.isConnected != null &&
        state.isConnected &&
        Boolean(state.isInternetReachable)
      setIsOnline(online)
    })
  }, [])

  return isOnline
}
