import { useEffect, useRef, useState } from 'react'
import { perpsMidsActivity } from './usePerpsLiveMids'

/** No WS activity for this long → start counting toward stale. */
const PERPS_WS_STALE_MS = 20_000
const CHECK_INTERVAL_MS = 2_000
/** Consecutive stale checks before showing reconnecting (avoids brief gaps). */
const STALE_STRIKES_REQUIRED = 2
/** Consecutive healthy checks before clearing reconnecting. */
const HEALTHY_STRIKES_REQUIRED = 2
/** Min interval between reconnect nudges while stale. */
const RECONNECT_COOLDOWN_MS = 10_000

export type PerpsConnectionStatus = 'connected' | 'reconnecting'

/**
 * Best-effort connection monitor for the perps WebSocket. React Native has no
 * `navigator.onLine`, and the SDK `ws` client auto-reconnects internally but
 * exposes no connection events, so — unlike core-web — this watches the
 * live-mids feed as a liveness heartbeat rather than socket-level signals.
 *
 * When the mids feed is mounted (`isFeedActive`) but stops ticking for a
 * sustained window, we mark `reconnecting` and periodically call
 * `nudgeReconnect` (bumps the provider's `wsResubscribeNonce`, which re-creates
 * the mids socket). Recovery requires several healthy checks so a single tick
 * after a blip does not flap the banner. With no feed mounted there is nothing
 * to monitor, so status stays `connected`.
 */
export function usePerpsConnectionMonitor(
  ready: boolean,
  nudgeReconnect: () => void
): PerpsConnectionStatus {
  const [status, setStatus] = useState<PerpsConnectionStatus>('connected')
  const staleStrikesRef = useRef(0)
  const healthyStrikesRef = useRef(0)
  const lastNudgeAtRef = useRef(0)

  useEffect(() => {
    if (!ready) {
      setStatus('connected')
      return
    }

    staleStrikesRef.current = 0
    healthyStrikesRef.current = 0

    const interval = setInterval(() => {
      // No live feed mounted → no heartbeat to evaluate; assume healthy so the
      // banner never shows on screens that don't stream mids.
      if (!perpsMidsActivity.isFeedActive()) {
        staleStrikesRef.current = 0
        healthyStrikesRef.current = 0
        setStatus('connected')
        return
      }

      const lastActivityAt = perpsMidsActivity.getLastActivityAt()
      const isStale =
        lastActivityAt === 0 || Date.now() - lastActivityAt > PERPS_WS_STALE_MS

      if (isStale) {
        healthyStrikesRef.current = 0
        staleStrikesRef.current += 1
        if (staleStrikesRef.current >= STALE_STRIKES_REQUIRED) {
          setStatus('reconnecting')
          const now = Date.now()
          if (now - lastNudgeAtRef.current >= RECONNECT_COOLDOWN_MS) {
            lastNudgeAtRef.current = now
            nudgeReconnect()
          }
        }
        return
      }

      staleStrikesRef.current = 0
      healthyStrikesRef.current += 1
      if (healthyStrikesRef.current >= HEALTHY_STRIKES_REQUIRED) {
        setStatus('connected')
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [ready, nudgeReconnect])

  return status
}
