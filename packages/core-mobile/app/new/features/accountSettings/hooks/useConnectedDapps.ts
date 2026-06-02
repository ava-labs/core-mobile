import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { useState, useEffect, useMemo } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { Session } from 'services/walletconnectv2/types'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { WalletConnectVersions } from 'store/walletConnectV2/types'
import {
  revokePermission,
  selectConnectedDomains
} from 'store/permissions/slice'
import Logger from 'utils/Logger'

const GET_DAPPS_V2_INTERVAL = 5000 // 5s

export type WCDapp = {
  kind: 'wc'
  id: string
  session: Session
  version: WalletConnectVersions.V2
}

export type InjectedDapp = {
  kind: 'injected'
  id: string
  domain: string
}

export type Dapp = WCDapp | InjectedDapp

export const useConnectedDapps = (): {
  allApprovedDapps: Dapp[]
  killDapp: (dapp: Dapp) => Promise<void>
  killAllDapps: () => Promise<void>
} => {
  const { killSessions } = useDappConnectionV2()
  const dispatch = useDispatch()
  const injectedDomains = useSelector(selectConnectedDomains, shallowEqual)
  const [approvedWcSessions, setApprovedWcSessions] = useState<Session[]>([])

  const allApprovedDapps = useMemo<Dapp[]>(() => {
    const wcDapps: Dapp[] = approvedWcSessions.map(session => ({
      kind: 'wc',
      id: session.topic,
      session,
      version: WalletConnectVersions.V2
    }))
    const injectedDapps: Dapp[] = injectedDomains.map(domain => ({
      kind: 'injected',
      id: `injected:${domain}`,
      domain
    }))
    return [...wcDapps, ...injectedDapps]
  }, [approvedWcSessions, injectedDomains])

  useEffect(() => {
    const getSessions = (): void => {
      try {
        const sessions = WalletConnectService.getSessions()
        setApprovedWcSessions(sessions)
      } catch (err) {
        Logger.error('failed to get sessions', err)
      }
    }

    // immediately fetch sessions onMounting
    // then do it periodically while on this screen
    getSessions()

    const id = setInterval(() => {
      getSessions()
    }, GET_DAPPS_V2_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const killDapp = async (dapp: Dapp): Promise<void> => {
    if (dapp.kind === 'wc') {
      // Callers (onPress) don't await this, so swallow + log a teardown
      // failure rather than letting it surface as an unhandled rejection.
      try {
        await killSessions([dapp.session])
      } catch (err) {
        Logger.error('failed to kill session', err)
      }
      setApprovedWcSessions(current =>
        current.filter(s => s.topic !== dapp.session.topic)
      )
    } else {
      dispatch(revokePermission({ domain: dapp.domain }))
    }
  }

  const killAllDapps = async (): Promise<void> => {
    // Revoke injected-domain grants even if WC teardown fails — otherwise a
    // single killSessions rejection would leave injected dApps connected and
    // the screen stuck. Also avoids an unhandled rejection at the call site.
    try {
      await killSessions(approvedWcSessions)
      setApprovedWcSessions([])
    } catch (err) {
      Logger.error('failed to kill sessions', err)
    }
    injectedDomains.forEach(domain => {
      dispatch(revokePermission({ domain }))
    })
  }

  return {
    allApprovedDapps,
    killDapp,
    killAllDapps
  }
}
