import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActiveValidatorDetails,
  Network,
  SortByOption,
  SortOrder,
  ValidationStatusType
} from '@avalabs/glacier-sdk'
import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { getUnixTime } from 'date-fns'
import { useSelector } from 'react-redux'
import GlacierService, {
  ListPrimaryNetworkValidatorsParams
} from 'services/glacier/GlacierService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { StakeTargetValidator } from 'types/earn'

/**
 * Finds the best validator node for the Fast Stake flow.
 *
 * Encodes the Staking 2.0 PRD FR-QS-5 auto-selection criteria as Glacier
 * server-side query filters:
 *
 * - `validationStatus: active`
 * - Uptime ≥ 98% (`minUptimePerformance`)
 * - Delegation fee ≤ 2% (`maxFeePercentage`)
 * - Delegation capacity ≥ requested stake amount
 * - Time remaining on the validator ≥ desired stake duration
 *
 * Results are sorted by uptime descending with `pageSize: 1`, so the hook
 * receives the single highest-uptime validator that meets every criterion.
 * When `preferredNodeId` is supplied (restake), that specific node is
 * queried first; if it still qualifies we reuse it, otherwise we fall back
 * to auto-selection. Mirrors core-web's `useFastStakeNode`.
 *
 * `enabled = false` disables the query (e.g. when the user picked a node
 * manually via the advanced flow).
 */
export const useFastStakeNode = ({
  stakingAmount,
  stakingEndTime,
  preferredNodeId,
  enabled = true
}: {
  stakingAmount: TokenUnit | undefined
  stakingEndTime: Date | undefined
  preferredNodeId?: string
  enabled?: boolean
}): UseQueryResult<StakeTargetValidator | undefined, Error> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const stakeAmountNAvax = stakingAmount?.toSubUnit().toString()
  // Use a unix-seconds anchor in the query key so callers can pass any
  // Date instance pointing to the same moment without triggering refetches.
  const endTimeSeconds = stakingEndTime
    ? getUnixTime(stakingEndTime)
    : undefined

  const canQuery =
    enabled && stakeAmountNAvax !== undefined && endTimeSeconds !== undefined

  return useQuery({
    queryKey: [
      'useFastStakeNode',
      stakeAmountNAvax,
      endTimeSeconds,
      preferredNodeId,
      isDeveloperMode
    ],
    staleTime: 60_000,
    queryFn: canQuery
      ? () =>
          fetchFastStakeValidator({
            isTestnet: isDeveloperMode,
            // Asserted by `canQuery`.
            stakeAmountNAvax: stakeAmountNAvax as string,
            minTimeRemainingSeconds:
              (endTimeSeconds as number) - getUnixTime(new Date()),
            preferredNodeId
          })
      : skipToken
  })
}

/**
 * Orchestrates the actual validator lookup. Extracted from the hook's
 * `queryFn` so the call sequencing (preferred-node first → auto-select
 * fallback) can be unit tested without rendering React. Exported for tests.
 */
export const fetchFastStakeValidator = async ({
  isTestnet,
  stakeAmountNAvax,
  minTimeRemainingSeconds,
  preferredNodeId
}: {
  isTestnet: boolean
  stakeAmountNAvax: string
  minTimeRemainingSeconds: number
  preferredNodeId?: string
}): Promise<StakeTargetValidator | undefined> => {
  const baseFilters = buildFastStakeFilters({
    isTestnet,
    stakeAmountNAvax,
    minTimeRemainingSeconds
  })

  // Restake path: check the user's previous validator first. If it still
  // meets every criterion we reuse it; otherwise we fall through to
  // auto-selection.
  if (preferredNodeId) {
    const preferred = await GlacierService.listPrimaryNetworkValidators({
      ...baseFilters,
      nodeIds: preferredNodeId,
      pageSize: 1
    })
    const matched = pickActiveValidators(preferred.validators)[0]
    if (matched) return toFastStakeValidator(matched)
  }

  const result = await GlacierService.listPrimaryNetworkValidators({
    ...baseFilters,
    sortBy: SortByOption.UPTIME_PERFORMANCE,
    sortOrder: SortOrder.DESC,
    pageSize: 1
  })
  const top = pickActiveValidators(result.validators)[0]
  return top ? toFastStakeValidator(top) : undefined
}

/**
 * Builds the common server-side filters used for every Fast Stake validator
 * lookup (both the preferred-node check and the auto-select fallback).
 * Exported for tests.
 */
export const buildFastStakeFilters = ({
  isTestnet,
  stakeAmountNAvax,
  minTimeRemainingSeconds
}: {
  isTestnet: boolean
  stakeAmountNAvax: string
  minTimeRemainingSeconds: number
}): ListPrimaryNetworkValidatorsParams => ({
  network: isTestnet ? Network.TESTNET : Network.MAINNET,
  validationStatus: ValidationStatusType.ACTIVE,
  minUptimePerformance: 98,
  maxFeePercentage: 2,
  minDelegationCapacity: stakeAmountNAvax,
  // Glacier rejects negative values, so floor to 0 when the user-provided
  // end time has already passed (e.g. clock skew).
  minTimeRemaining: Math.max(0, minTimeRemainingSeconds)
})

/**
 * Narrows Glacier's union return (`Completed | Active | Pending | Removed`)
 * to just `ActiveValidatorDetails`. The `validationStatus: 'active'` server
 * filter already excludes the other states, but the SDK's return type is
 * the broader union — narrow defensively so the rest of the codebase
 * doesn't have to discriminate. Exported for tests.
 */
export const pickActiveValidators = <T extends { validationStatus: string }>(
  validators: T[]
): ActiveValidatorDetails[] =>
  validators.filter(
    (v): v is T & ActiveValidatorDetails =>
      v.validationStatus === ValidationStatusType.ACTIVE
  )

/**
 * Converts Glacier's `ActiveValidatorDetails` to the minimal, flow-neutral
 * `StakeTargetValidator` shape the stake confirm flow expects. Glacier
 * returns `nodeId` (lowercase d) and a numeric `endTimestamp`; we mirror
 * PVM's `nodeID` / string `endTime` so the consumer can treat both sources
 * interchangeably. Exported for tests.
 */
export const toFastStakeValidator = (
  v: ActiveValidatorDetails
): StakeTargetValidator => ({
  nodeID: v.nodeId,
  endTime: v.endTimestamp.toString()
})
