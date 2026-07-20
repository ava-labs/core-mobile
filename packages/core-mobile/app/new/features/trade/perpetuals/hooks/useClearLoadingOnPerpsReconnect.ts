import { useEffect } from 'react'
import { usePerps } from '../contexts/PerpsProvider'

/** Clears a local `loading` flag when the perps socket drops mid-action. */
export function useClearLoadingOnPerpsReconnect(
  clearLoading: () => void
): void {
  const { connectionStatus } = usePerps()

  useEffect(() => {
    if (connectionStatus === 'reconnecting') {
      clearLoading()
    }
  }, [connectionStatus, clearLoading])
}
