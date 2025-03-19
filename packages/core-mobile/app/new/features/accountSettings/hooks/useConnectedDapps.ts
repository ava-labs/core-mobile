import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { useState, useEffect, useMemo } from 'react'
import type { Dapp } from 'screens/rpc/ConnectedDapps/types'
import { Session } from 'services/walletconnectv2/types'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { WalletConnectVersions } from 'store/walletConnectV2/types'
import Logger from 'utils/Logger'

const GET_DAPPS_V2_INTERVAL = 5000 // 5s

export const useConnectedDapps = (): {
  allApprovedDapps: Dapp[]
  killSession: (topic: string) => Promise<void>
} => {
  const { killSessions } = useDappConnectionV2()
  const [approvedDappsV2, setApprovedDappsV2] = useState<Session[]>([])

  const allApprovedDapps = useMemo(() => {
    return approvedDappsV2.map<Dapp>(dapp => ({
      id: dapp.topic,
      dapp,
      version: WalletConnectVersions.V2
    }))
  }, [approvedDappsV2])

  useEffect(() => {
    const getSessions = (): void => {
      try {
        const sessions = WalletConnectService.getSessions()
        setApprovedDappsV2(sessions)
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

  const killSession = async (topic: string): Promise<void> => {
    const session = approvedDappsV2.find(dapp => dapp.topic === topic)
    if (!session) return
    await killSessions([session])
    setApprovedDappsV2(
      approvedDappsV2.filter(dapp => dapp.topic !== session.topic)
    )
  }

  return {
    allApprovedDapps,
    killSession
  }
}
