import { Avalanche } from '@avalabs/core-wallets-sdk'
import { ChainId } from '@avalabs/core-chains-sdk'
import { RpcRequest } from '@avalabs/vm-module-types'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import Logger from 'utils/Logger'
import { RequestContext } from 'store/rpc/types'

const AVALANCHE_TESTNET_CHAIN_IDS = [
  ChainId.AVALANCHE_TESTNET_ID,
  ChainId.AVALANCHE_TEST_X,
  ChainId.AVALANCHE_TEST_P
] as const

type NetworkKey = 'mainnet' | 'fuji'

// Helicon is a network-wide upgrade so any node on Mainnet/Fuji returns the
// same answer; we don't need to use the user's selected RPC.
const inFlight = new Map<NetworkKey, Promise<boolean>>()
const resolvedAt = new Map<NetworkKey, number>()
const CACHE_TTL_MS = 60_000

// `info.getUpgradesInfo` returns `heliconTime` once the node knows about the
// Helicon (ACP-194) upgrade. The TypeScript types in our pinned
// `@avalabs/avalanchejs` version do not yet expose this field, so we read it
// via a narrow assertion on the returned object.
type WithHeliconTime = { heliconTime?: string }

// Returns true only when we can prove Helicon is *not yet* live. Any
// uncertainty (missing field, unparseable date, etc.) falls through to the
// caller's conservative `return false` (post-Helicon flow).
const isPreHeliconAt = (heliconTime: string | undefined): boolean => {
  if (!heliconTime) return false
  const activationDate = new Date(heliconTime)
  if (Number.isNaN(activationDate.getTime())) return false
  return activationDate.getTime() > Date.now()
}

const fetchOptimisticGate = async (
  networkKey: NetworkKey,
  chainId: string
): Promise<boolean> => {
  const provider =
    networkKey === 'fuji'
      ? Avalanche.JsonRpcProvider.getDefaultFujiProvider()
      : Avalanche.JsonRpcProvider.getDefaultMainnetProvider()

  try {
    const upgradesInfo = await provider.getInfo().getUpgradesInfo()
    const heliconTime = (upgradesInfo as WithHeliconTime).heliconTime
    // Only enable optimistic UI when we can prove Helicon is still in the
    // future; missing/unparseable `heliconTime` means we don't know, so
    // default to the safer post-Helicon flow.
    return isPreHeliconAt(heliconTime)
  } catch (error) {
    Logger.error('Failed to fetch Helicon upgrade status', { chainId, error })
    // Conservative fallback: post-Helicon, the optimistic UX is the regression
    // we're trying to remove, so prefer the standard pending->success flow
    // when we can't determine the upgrade status.
    return false
  }
}

const getOptimisticGate = (
  networkKey: NetworkKey,
  chainId: string
): Promise<boolean> => {
  const cachedAt = resolvedAt.get(networkKey)
  const cached = inFlight.get(networkKey)
  if (
    cached &&
    cachedAt !== undefined &&
    Date.now() - cachedAt < CACHE_TTL_MS
  ) {
    return cached
  }

  const promise = fetchOptimisticGate(networkKey, chainId)
  inFlight.set(networkKey, promise)
  resolvedAt.set(networkKey, Date.now())
  return promise
}

// Optimistic confirmations (success toast/confetti shown on broadcast rather
// than after the network confirms) are kept only until Helicon (ACP-194) is
// enabled. Post-Helicon, real confirmations come back fast enough that the
// optimistic UX is misleading on failure.
//
// This util is called once per tx, in `ApprovalController.onTransactionPending`.
// The result is cached on the controller's `optimisticGateMap` (keyed by
// requestId) and re-read in `onTransactionConfirmed` / `onTransactionReverted`,
// so pending and confirmed always see the same decision. The per-network
// in-flight cache below is a fetch optimization across consecutive txs only,
// not a correctness mechanism for a single tx.
//
// The `sae-override` PostHog flag (snapshotted onto request.context by
// createInAppRequest) supersedes the InfoAPI check when set to 'enabled' or
// 'disabled' — used by QA to test the post-Helicon path before activation and
// as a runtime escape hatch if the new flow misbehaves post-launch. Mirrors
// core-extension PR 900.
//
// TODO: Remove this util and its callers once Helicon is enabled on all networks.
export async function isOptimisticConfirmationEnabled(
  request: RpcRequest
): Promise<boolean> {
  const override = request.context?.[RequestContext.SAE_OVERRIDE]
  // 'enabled' means SAE/post-Helicon behavior is forced on -> no optimistic UI.
  if (override === 'enabled') return false
  // 'disabled' means SAE/post-Helicon behavior is forced off -> keep optimistic UI.
  if (override === 'disabled') return true

  const numericChainId = getChainIdFromCaip2(request.chainId)

  if (numericChainId === undefined || !isAvalancheChainId(numericChainId)) {
    return false
  }

  // The local Avalanche network has no default mainnet/fuji-style provider
  // we can query for upgrade info, so we don't speak for it here. Dev-only;
  // QA can still flip the `sae-override` flag to exercise either path.
  if (numericChainId === ChainId.AVALANCHE_LOCAL_ID) {
    return false
  }

  const networkKey: NetworkKey = (
    AVALANCHE_TESTNET_CHAIN_IDS as readonly number[]
  ).includes(numericChainId)
    ? 'fuji'
    : 'mainnet'

  return getOptimisticGate(networkKey, request.chainId)
}

// Test-only: clears the network gate cache between tests.
export const __resetOptimisticGateCacheForTests = (): void => {
  inFlight.clear()
  resolvedAt.clear()
}
