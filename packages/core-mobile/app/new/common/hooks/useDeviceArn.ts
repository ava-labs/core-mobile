import { useState, useEffect } from 'react'
import { CommonStorageKeys } from 'utils/mmkv'
import { commonStorage } from 'utils/mmkv'

/**
 * Hook to get deviceArn from MMKV storage.
 * Subscribes to storage changes so the value updates reactively
 * when registerDeviceToNotificationSender writes the ARN.
 */
export function useDeviceArn(): string | undefined {
  const [deviceArn, setDeviceArn] = useState<string | undefined>(() =>
    commonStorage.getString(CommonStorageKeys.NOTIFICATIONS_OPTIMIZATION)
  )

  useEffect(() => {
    const listener = commonStorage.addOnValueChangedListener(changedKey => {
      if (changedKey === CommonStorageKeys.NOTIFICATIONS_OPTIMIZATION) {
        setDeviceArn(
          commonStorage.getString(CommonStorageKeys.NOTIFICATIONS_OPTIMIZATION)
        )
      }
    })
    return () => listener.remove()
  }, [])

  return deviceArn
}
