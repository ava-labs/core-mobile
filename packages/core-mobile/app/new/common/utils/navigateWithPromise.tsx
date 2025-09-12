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
  params = {}
}: {
  pathname: string
  params?: Record<string, string | number | boolean>
}): Promise<void> {
  const id = uuid()

  return new Promise<void>(resolve => {
    navigationEvents.once(`closed:${id}`, resolve)

    // @ts-ignore TODO: make routes typesafe
    router.navigate({ pathname, params: { ...params, navId: id } })
  })
}

/** No-op unless navId exists (i.e., launched via navigateWithPromise) */
export function useNavigationResolve(): void {
  const { navId } = useLocalSearchParams<{ navId?: string }>()
  useEffect(() => {
    if (!navId) return
    return () => {
      navigationEvents.emit(`closed:${navId}`)
    }
  }, [navId])
}

export function withNavigationResolve<P extends object>(
  Wrapped: React.ComponentType<P>
): React.FC<P> {
  const Wrapper: React.FC<P> = props => {
    useNavigationResolve() // navId 없으면 no-op
    return <Wrapped {...props} />
  }

  Wrapper.displayName = `withNavigationResolve(${
    Wrapped.displayName ?? Wrapped.name ?? 'Component'
  })`

  return Wrapper
}
