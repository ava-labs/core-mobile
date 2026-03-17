import { EventEmitter } from 'events'
import React from 'react'
import { Href, router } from 'expo-router'
import { useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { uuid } from 'utils/uuid'

const navigationEvents = new EventEmitter()

/** Open a screen and resolve when it closes */
export function navigateWithPromise(
  href: Href,
  { timeoutMs = 60_000 }: { timeoutMs?: number } = {}
): Promise<void> {
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

    const timer = setTimeout(resolveOnce, timeoutMs)

    router.navigate(
      (typeof href === 'string'
        ? { pathname: href, params: { navId: id } }
        : { ...href, params: { ...href.params, navId: id } }) as Href
    )
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
