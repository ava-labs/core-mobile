import {
  ApprovalParams,
  SetDeveloperModeParams,
  SessionProposalParams,
  EditContactParams,
  AddEthereumChainParams,
  KeystoneSignerParams,
  KeystoneTroubleshootingParams
} from './types'

// a simple in-memory cache (no reactivity or persistence support)
// for wallet connect related data
export const walletConnectCache = {
  sessionProposalParams: createCache<SessionProposalParams>('session proposal'),
  approvalParams: createCache<ApprovalParams>('approval'),
  setDeveloperModeParams:
    createCache<SetDeveloperModeParams>('set developer mode'),
  editContactParams: createCache<EditContactParams>('edit contact'),
  addEthereumChainParams:
    createCache<AddEthereumChainParams>('add ethereum chain'),
  keystoneSignerParams: createCache<KeystoneSignerParams>('keystone signer'),
  keystoneTroubleshootingParams: createCache<KeystoneTroubleshootingParams>(
    'keystone troubleshooting'
  )
}

function createCache<T>(key: string): {
  set: (data: T) => void
  get: () => T
} {
  let value: T | null = null

  return {
    set: (data: T) => {
      value = data
    },
    get: (): T => {
      if (!value) {
        throw new Error(`No ${key} params found`)
      }
      const data = value
      value = null // auto-clear after retrieval
      return data
    }
  }
}
