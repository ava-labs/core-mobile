import { EventEmitter } from 'events'
import React from 'react'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { uuid } from 'utils/uuid'

const navigationEvents = new EventEmitter()

/** Open a screen and resolve when it closes */
export function navigateWithPromise({
  pathname,
  params = {},
  timeoutMs = 15000
}: {
  pathname: string
  params?: Record<string, string | number | boolean>
  timeoutMs?: number
}): Promise<void> {
  const id = uuid()

  return new Promise<void>(resolve => {
    let settled = false
    const resolveOnce = (): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      navigationEvents.removeListener(`closed:${id}`, resolveOnce)
      resolve()
    }

    navigationEvents.once(`closed:${id}`, resolveOnce)

    const timer = setTimeout(() => {
      resolveOnce()
    }, timeoutMs)

    // @ts-ignore TODO: make routes typesafe
    router.navigate({ pathname, params: { ...params, navId: id } })
  })
}

/** No-op unless navId exists (i.e., launched via navigateWithPromise) */
function useNavigationEvents(): void {
  const { navId } = useLocalSearchParams<{ navId?: string }>()
  useEffect(() => {
    if (!navId) return
    return () => {
      navigationEvents.emit(`closed:${navId}`)
    }
  }, [navId])
}

export function withNavigationEvents<P extends object>(
  Wrapped: React.ComponentType<P>
): React.FC<P> {
  const Wrapper: React.FC<P> = props => {
    useNavigationEvents()
    return <Wrapped {...props} />
  }

  Wrapper.displayName = `withNavigationEvents(${
    Wrapped.displayName ?? Wrapped.name ?? 'Component'
  })`

  return Wrapper
}
