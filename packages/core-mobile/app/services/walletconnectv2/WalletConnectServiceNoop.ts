import { SessionTypes } from '@walletconnect/types'

export class WalletConnectServiceNoop {
  init = async (): Promise<void> => {
    //noop
  }

  pair = async (): Promise<void> => {
    //noop
  }

  getSessions = (): SessionTypes.Struct[] => {
    return []
  }

  getSession = (): SessionTypes.Struct | undefined => {
    return undefined
  }

  approveSession = async (): Promise<SessionTypes.Struct> => {
    return {} as SessionTypes.Struct
  }

  rejectSession = async (): Promise<void> => {
    //noop
  }

  approveRequest = async (): Promise<void> => {
    //noop
  }

  rejectRequest = async (): Promise<void> => {
    //noop
  }

  killSession = async (): Promise<void> => {
    //noop
  }

  killAllSessions = async (): Promise<void> => {
    //noop
  }

  killSessions = (): void => {
    //noop
  }

  updateSession = async (): Promise<void> => {
    //noop
  }

  updateSessionWithTimeout = async (): Promise<void> => {
    //noop
  }

  updateSessions = async (): Promise<void> => {
    //noop
  }

  updateSessionWithTimeoutForNonEvm = async (): Promise<void> => {
    //noop
  }
}
