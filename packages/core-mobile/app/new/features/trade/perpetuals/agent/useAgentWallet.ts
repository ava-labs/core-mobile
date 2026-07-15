import {
  approveAgent,
  getExtraAgents,
  isAgentAuthorized,
  isApiError,
  type Address,
  type PerpsEvmSigner
} from '@avalabs/perps-sdk'
import { showSnackbar } from 'common/utils/toast'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Hex } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import Logger from 'utils/Logger'
import {
  createAgentPerpsSigner,
  createUserSigner,
  createWalletPerpsSigner,
  ensureBigUint64Safe
} from '../services/perpsSigner'
import { logHyperliquidError } from '../utils/orderExecution'
import {
  clearAgentFromStorage,
  loadAgentFromStorage,
  saveAgentToStorage,
  type PerpsAgentRecord
} from './storage'

/**
 * Name registered with Hyperliquid for our agent slot. HL only surfaces
 * *named* extra agents in `extraAgents`, which the multi-device verifier needs
 * to validate the stored key. Distinct from core-web's `'core'` tag so mobile
 * and web keep separate agents and can trade concurrently without one approval
 * revoking the other.
 */
const AGENT_NAME = 'core-mobile'

// Hyperliquid perps are mainnet-only in Core; there is no testnet path.
const IS_MAINNET = true

function hyperliquidErrorText(error: unknown): string {
  if (isApiError(error)) {
    const rb = error.responseBody
    if (typeof rb === 'object' && rb !== null && 'response' in rb) {
      const r = (rb as { response?: unknown }).response
      if (typeof r === 'string') return r
    }
    return error.message
  }
  return error instanceof Error ? error.message : String(error)
}

/** HL rejects L1 actions (incl. approveAgent) until the master has deposited. */
function isHyperliquidAccountMissingError(error: unknown): boolean {
  const text = hyperliquidErrorText(error).toLowerCase()
  return (
    text.includes('must deposit') ||
    text.includes('user or api wallet does not exist')
  )
}

export type UseAgentWalletResult = {
  readonly hasAgent: boolean
  readonly agentAddress: Address | undefined
  /** Signer for `createPerpsManager`: agent key if approved, else master wallet. */
  readonly perpsSigner: PerpsEvmSigner | undefined
  readonly isApproving: boolean
  readonly isLoadingAgent: boolean
  readonly approve: () => Promise<void>
  readonly revoke: () => Promise<void>
  readonly invalidateAndReprompt: () => Promise<void>
}

/**
 * Manages the per-user Hyperliquid agent (session) key: loads it from secure
 * storage, verifies it's still authorized on HL, and exposes an `approve`
 * flow that prompts the master wallet once then persists an in-process signer
 * so subsequent L1 actions are silent.
 *
 * `enabled` gates the (secure-storage + network) agent work behind the
 * provider's lazy activation, so signed-in users who never open perps don't
 * read the keystore or hit Hyperliquid on launch.
 */
export function useAgentWallet(
  userAddress: Address | undefined,
  enabled: boolean
): UseAgentWalletResult {
  const { request } = useInAppRequest()
  const [record, setRecord] = useState<PerpsAgentRecord | undefined>(undefined)
  const [isLoadingAgent, setIsLoadingAgent] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const approvingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (!enabled) {
      setRecord(undefined)
      setIsLoadingAgent(false)
      return
    }
    setIsLoadingAgent(true)
    if (userAddress === undefined) {
      setRecord(undefined)
      setIsLoadingAgent(false)
      return
    }

    loadAgentFromStorage(userAddress)
      .then(loaded => {
        if (!cancelled) {
          setRecord(loaded)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecord(undefined)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingAgent(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [userAddress, enabled])

  const agentAddress = useMemo<Address | undefined>(() => {
    if (record === undefined) {
      return undefined
    }
    return privateKeyToAccount(record.privateKey as Hex).address
  }, [record])

  const perpsSigner = useMemo<PerpsEvmSigner | undefined>(() => {
    if (record !== undefined) {
      return createAgentPerpsSigner(record.privateKey as Hex)
    }
    if (userAddress === undefined) {
      return undefined
    }
    return createWalletPerpsSigner(userAddress, request)
  }, [record, userAddress, request])

  useEffect(() => {
    // Run once so L1 actionHash nonce encoding is correct before any exchange call.
    ensureBigUint64Safe()
  }, [])

  /**
   * On account change, verify the stored agent is still authorized on HL. If
   * the user approved a fresh agent on another device, ours was replaced and
   * every L1 action would fail — clear the stale key. Leave it alone on
   * transport errors (revoking on a false negative is worse than revoking late).
   */
  useEffect(() => {
    if (
      userAddress === undefined ||
      record === undefined ||
      agentAddress === undefined
    ) {
      return
    }
    const controller = new AbortController()
    let cancelled = false
    getExtraAgents({
      user: userAddress,
      isMainnet: IS_MAINNET,
      signal: controller.signal
    })
      .then(agents => {
        if (cancelled || isAgentAuthorized(agentAddress, agents)) {
          return
        }
        return clearAgentFromStorage(userAddress).then(() => {
          if (!cancelled) {
            setRecord(undefined)
          }
        })
      })
      .catch(() => {
        // HL unreachable — keep current key, will be re-validated next load.
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [userAddress, agentAddress, record])

  const approve = useCallback(async () => {
    if (userAddress === undefined) {
      throw new Error('Wallet not connected')
    }
    if (approvingRef.current) {
      return
    }
    approvingRef.current = true
    setIsApproving(true)
    try {
      const privateKey = generatePrivateKey()
      const evm = privateKeyToAccount(privateKey)
      Logger.info('[useAgentWallet] approving agent', {
        user: userAddress,
        agent: evm.address
      })
      await approveAgent({
        userSigner: createUserSigner(userAddress, request),
        agentAddress: evm.address,
        isMainnet: IS_MAINNET,
        agentName: AGENT_NAME
      })
      // Do not trust a bare exchange "ok" — confirm the agent is visible on HL
      // before persisting. Otherwise we store a key that cannot trade.
      const agents = await getExtraAgents({
        user: userAddress,
        isMainnet: IS_MAINNET
      })
      if (!isAgentAuthorized(evm.address, agents)) {
        Logger.error('[useAgentWallet] agent missing after approve', {
          agent: evm.address,
          agents
        })
        throw new Error(
          'Hyperliquid did not register the trading agent. Please try again.'
        )
      }
      const newRecord: PerpsAgentRecord = { privateKey, userAddress }
      await saveAgentToStorage(userAddress, newRecord)
      setRecord(newRecord)
      Logger.info('[useAgentWallet] agent approved and verified', evm.address)
    } catch (error) {
      logHyperliquidError('[useAgentWallet] approve failed', error)
      if (isHyperliquidAccountMissingError(error)) {
        showSnackbar(
          'Deposit USDC to Hyperliquid first, then enable background trading.'
        )
      } else if (error instanceof Error) {
        showSnackbar(error.message)
      }
      throw error
    } finally {
      approvingRef.current = false
      setIsApproving(false)
    }
  }, [userAddress, request])

  const revoke = useCallback(async () => {
    if (userAddress === undefined) {
      return
    }
    await clearAgentFromStorage(userAddress)
    setRecord(undefined)
  }, [userAddress])

  return {
    hasAgent: record !== undefined,
    agentAddress,
    perpsSigner,
    isApproving,
    isLoadingAgent,
    approve,
    revoke,
    invalidateAndReprompt: revoke
  }
}
