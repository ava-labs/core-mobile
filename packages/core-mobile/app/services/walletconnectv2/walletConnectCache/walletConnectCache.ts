import { ApprovalParams, SessionProposalParams } from './types'

let sessionProposalParams: SessionProposalParams | null = null
let approvalParams: ApprovalParams | null = null

// a simple in-memory cache (no reactivity or persistence support)
// for wallet connect related data
export const walletConnectCache = {
  sessionProposalParams: {
    set: (data: SessionProposalParams) => {
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
  },
  approvalParams: {
    set: (data: ApprovalParams) => {
      approvalParams = data
    },
    get: () => {
      if (!approvalParams) {
        throw new Error('No approval params found')
      }

      // approvalParams = null // auto-clear after retrieval
      return approvalParams
    }
  }
}
