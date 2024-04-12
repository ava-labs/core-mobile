import { createAction } from '@reduxjs/toolkit'
import { Session } from 'services/walletconnectv2/types'
import { PeerMeta } from 'store/rpc/types'

export const reducerName = 'walletConnectV2'

// actions
export const onDisconnect = createAction<PeerMeta>(
  `${reducerName}/onDisconnect`
)

export const newSession = createAction<string>(`${reducerName}/newSession`)

export const killSessions = createAction<Session[]>(
  `${reducerName}/killSessions`
)
