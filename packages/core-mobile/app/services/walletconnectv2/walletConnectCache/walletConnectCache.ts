import {
  ApprovalParams,
  SetDeveloperModeParams,
  SessionProposalParams,
  EditContactParams
} from './types'

let sessionProposalParams: SessionProposalParams | null = null
let approvalParams: ApprovalParams | null = null
let setDeveloperModeParams: SetDeveloperModeParams | null = null
let editContactParams: EditContactParams | null = null

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
      const data = approvalParams
      approvalParams = null // auto-clear after retrieval
      return data
    }
  },
  setDeveloperModeParams: {
    set: (data: SetDeveloperModeParams) => {
      setDeveloperModeParams = data
    },
    get: () => {
      if (!setDeveloperModeParams) {
        throw new Error('No setdeveloper mode params found')
      }

      const data = setDeveloperModeParams
      setDeveloperModeParams = null // auto-clear after retrieval
      return data
    }
  },
  editContactParams: {
    set: (data: EditContactParams) => {
      editContactParams = data
    },
    get: () => {
      if (!editContactParams) {
        throw new Error('No edit contact params found')
      }

      const data = editContactParams
      editContactParams = null // auto-clear after retrieval
      return data
    }
  }
}
