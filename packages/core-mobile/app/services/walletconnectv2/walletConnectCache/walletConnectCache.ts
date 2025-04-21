import { SessionProposalV2Params } from './types'

let sessionProposalParams: SessionProposalV2Params | null = null

// a simple in-memory cache (no reactivity or persistence support)
// for wallet connect related data
export const walletConnectCache = {
  sessionProposalParams: {
    set: (data: SessionProposalV2Params) => {
      sessionProposalParams = data
    },
    get: () => {
      if (!sessionProposalParams) {
        throw new Error('No session proposal params found')
      }

      const data = sessionProposalParams
      sessionProposalParams = null // auto-clear after retrieval
      return data
    }
  }
}
