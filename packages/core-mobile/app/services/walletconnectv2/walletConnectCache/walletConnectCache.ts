import { createCache } from 'utils/createCache'
import {
  ApprovalParams,
  BatchApprovalScreenParams,
  SetDeveloperModeParams,
  SessionProposalParams,
  EditContactParams,
  AddEthereumChainParams,
  WatchAssetParams
} from './types'

// a simple in-memory cache (no reactivity or persistence support)
// for wallet connect related data
export const walletConnectCache = {
  sessionProposalParams: createCache<SessionProposalParams>('session proposal'),
  approvalParams: createCache<ApprovalParams>('approval'),
  batchApprovalParams: createCache<BatchApprovalScreenParams>('batch approval'),
  setDeveloperModeParams:
    createCache<SetDeveloperModeParams>('set developer mode'),
  editContactParams: createCache<EditContactParams>('edit contact'),
  addEthereumChainParams:
    createCache<AddEthereumChainParams>('add ethereum chain'),
  watchAssetParams: createCache<WatchAssetParams>('watch asset')
}
