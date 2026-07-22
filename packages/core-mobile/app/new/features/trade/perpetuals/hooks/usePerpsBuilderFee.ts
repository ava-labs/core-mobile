import {
  isPerpsUserRejection,
  PerpsEnvironment,
  type Address,
  type BuilderInfo
} from '@avalabs/perps-sdk'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { showSnackbar } from 'common/utils/toast'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { useCallback, useMemo } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import { createUserSigner } from '../services/perpsSigner'
import { logHyperliquidError } from '../utils/orderExecution'
import {
  markrFeeToHyperliquidTenthsBps,
  useMarkrPartnerInfo
} from './useMarkrPartnerInfo'

/** 5 min — `maxBuilderFee` only changes when the user re-approves, so cache aggressively. */
const STALE_TIME_MS = 5 * 60 * 1000

export type UsePerpsBuilderFeeResult = {
  /** Markr partner info; `undefined` until the partner-info endpoint resolves. */
  readonly partnerAddress: Address | undefined
  /** Per-order builder fee in HL's native unit (tenths of basis points). */
  readonly feeTenthsBps: number | undefined
  /** Current approved max on HL, in tenths of basis points. `undefined` while loading. */
  readonly approvedMaxTenthsBps: number | undefined
  /**
   * `true` once `approvedMaxTenthsBps >= feeTenthsBps`. Orders can include
   * the `builder` field without a fresh approval.
   */
  readonly isApproved: boolean
  /** Loading any of: partner info, approved max query, or pending approval mutation. */
  readonly isLoading: boolean
  /** `true` while the user-signed approval is being submitted. */
  readonly isApproving: boolean
  /**
   * Trigger the master-wallet signature flow to raise the approved max to the
   * current Markr fee. Throws on signer / API failure.
   */
  readonly approve: () => Promise<void>
  /** Force a refetch of the `maxBuilderFee` info query. */
  readonly refresh: () => void
  /**
   * Builder field to attach to every order once resolved, or `undefined` while
   * Markr partner info is still loading (orders then place without a code).
   */
  readonly builderInfo: BuilderInfo | undefined
}

/**
 * Combines Markr partner info with Hyperliquid's `maxBuilderFee` to track
 * whether the connected user has already authorized the configured builder
 * fee (Core's revenue on each fill). Gate order submission with this and
 * prompt the `ApproveBuilderFee` master-wallet signature on first trade.
 *
 * **Re-approval policy:** approves at the exact current Markr fee
 * (`maxFeeRate` = Markr's `fee`). If Markr later raises the fee, the next
 * order will fail HL's check and `isApproved` will flip to `false`,
 * prompting the user once more.
 */
export function usePerpsBuilderFee(): UsePerpsBuilderFeeResult {
  const { manager, userAddress: user } = usePerps()
  const { request } = useInAppRequest()
  const queryClient = useQueryClient()

  const partnerInfoQuery = useMarkrPartnerInfo('perps')
  const feeTenthsBps = useMemo(
    () =>
      partnerInfoQuery.data
        ? markrFeeToHyperliquidTenthsBps(partnerInfoQuery.data.fee)
        : undefined,
    [partnerInfoQuery.data]
  )
  const partnerAddress = partnerInfoQuery.data?.address as Address | undefined

  /**
   * Stable across manager re-inits: perps are mainnet-only, so we key on the
   * constant environment rather than `manager.environment` (which flips while
   * the manager re-initializes — e.g. when the agent key activates after
   * step 1). A churning key blanks the approved data, which would momentarily
   * flip `isApproved`/`isTradingEnabled` false and flicker the enable-trading
   * modal between steps.
   */
  const maxBuilderFeeKey = useMemo(
    () =>
      [
        ReactQueryKeys.PERPS_MAX_BUILDER_FEE,
        PerpsEnvironment.Mainnet,
        user,
        partnerAddress
      ] as const,
    [user, partnerAddress]
  )

  const approvedQuery = useQuery({
    // `manager` is intentionally excluded from the key (see `maxBuilderFeeKey`
    // doc): the query re-runs on `enabled`/mount, but the key must stay stable
    // across manager re-inits so `isApproved` never flickers between setup
    // steps. `user`/`partnerAddress` are already in the key.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: maxBuilderFeeKey,
    enabled:
      manager !== null && user !== undefined && partnerAddress !== undefined,
    staleTime: STALE_TIME_MS,
    queryFn: () => {
      if (
        manager === null ||
        user === undefined ||
        partnerAddress === undefined
      ) {
        throw new Error('Prerequisites missing')
      }
      return manager.info.getMaxBuilderFee(user, partnerAddress)
    }
  })

  const isApproved =
    feeTenthsBps !== undefined &&
    approvedQuery.data !== undefined &&
    approvedQuery.data >= feeTenthsBps

  const { mutateAsync: submitApproval, isPending: isApproving } = useMutation({
    mutationFn: async () => {
      if (manager === null) {
        throw new Error('Perps not ready')
      }
      if (user === undefined) {
        throw new Error('Connect wallet to approve builder fee')
      }
      if (partnerAddress === undefined || feeTenthsBps === undefined) {
        throw new Error('Builder fee config unavailable')
      }
      // Per HL spec, `approveBuilderFee` MUST be signed by the master wallet
      // (agent keys are rejected), so we build a fresh master-wallet signer
      // rather than reusing the manager's (possibly agent-backed) signer.
      await manager.approveBuilderFee({
        userSigner: createUserSigner(user, request),
        builder: partnerAddress,
        maxFeeRateTenthsBps: feeTenthsBps
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: maxBuilderFeeKey })
    }
  })

  const approve = useCallback(async () => {
    try {
      await submitApproval()
    } catch (e) {
      logHyperliquidError('[usePerpsBuilderFee] approve failed', e)
      if (isPerpsUserRejection(e)) {
        showSnackbar('User rejected the request.')
      } else {
        const message = e instanceof Error ? e.message : String(e)
        showSnackbar(`Could not approve builder fee. ${message}`)
      }
      throw e
    }
  }, [submitApproval])

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: maxBuilderFeeKey })
  }, [queryClient, maxBuilderFeeKey])

  const builderInfo = useMemo<BuilderInfo | undefined>(
    () =>
      partnerAddress !== undefined && feeTenthsBps !== undefined
        ? { b: partnerAddress, f: feeTenthsBps }
        : undefined,
    [partnerAddress, feeTenthsBps]
  )

  return {
    partnerAddress,
    feeTenthsBps,
    approvedMaxTenthsBps: approvedQuery.data,
    isApproved,
    isLoading:
      partnerInfoQuery.isLoading || approvedQuery.isLoading || isApproving,
    isApproving,
    approve,
    refresh,
    builderInfo
  }
}
