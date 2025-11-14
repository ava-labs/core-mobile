import { useDisableLockAppStore } from 'features/accountSettings/store'
import { useEffect } from 'react'

/**
 * This is to prevent the app from locking when the user is in these routes
 * For example, when the user is in the add recovery methods screen, the app might prompt prompt to setup passkey or FIDO2 device
 */
export const useDisableLockApp = (): void => {
  useEffect(() => {
    useDisableLockAppStore.setState({ disableLockApp: true })
    return () => {
      useDisableLockAppStore.setState({ disableLockApp: false })
    }
  }, [])
}
