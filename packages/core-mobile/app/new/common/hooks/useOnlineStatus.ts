import { useState, useEffect } from 'react'
import { onlineManager } from '@tanstack/react-query'

/**
 * Subscribes to React Query's onlineManager — the single source of truth
 * for connectivity state.  The actual detection logic (NetInfo + HTTP ping
 * + offline polling) lives in ReactQueryProvider where it runs once at
 * module scope.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline())

  useEffect(() => {
    return onlineManager.subscribe(() => {
      setIsOnline(onlineManager.isOnline())
    })
  }, [])

  return isOnline
}
