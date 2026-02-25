import { useState, useEffect } from 'react'
import { StorageKey } from 'resources/Constants'
import { commonStorage } from 'utils/mmkv'

/**
 * Hook to get deviceArn from MMKV storage.
 * Subscribes to storage changes so the value updates reactively
 * when registerDeviceToNotificationSender writes the ARN.
 */
export function useDeviceArn(): string | undefined {
  const [deviceArn, setDeviceArn] = useState<string | undefined>(() =>
    commonStorage.getString(StorageKey.NOTIFICATIONS_OPTIMIZATION)
  )

  useEffect(() => {
    const listener = commonStorage.addOnValueChangedListener(changedKey => {
      if (changedKey === StorageKey.NOTIFICATIONS_OPTIMIZATION) {
        setDeviceArn(
          commonStorage.getString(StorageKey.NOTIFICATIONS_OPTIMIZATION)
        )
      }
    })
    return () => listener.remove()
  }, [])

  return deviceArn
}
