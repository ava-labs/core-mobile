import { createCache, createKeyedCache } from 'utils/createCache'
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
  // Keyed by requestId so concurrent approval requests can't clobber each
  // other's params (WalletConnect race condition). ApprovalController seeds it
  // via .set(requestId, ...) and ApprovalScreen reads it via .get(requestId).
  approvalParams: createKeyedCache<ApprovalParams>('approval'),
  batchApprovalParams: createCache<BatchApprovalScreenParams>('batch approval'),
  setDeveloperModeParams:
    createCache<SetDeveloperModeParams>('set developer mode'),
  editContactParams: createCache<EditContactParams>('edit contact'),
  addEthereumChainParams:
    createCache<AddEthereumChainParams>('add ethereum chain'),
  watchAssetParams: createCache<WatchAssetParams>('watch asset')
}
