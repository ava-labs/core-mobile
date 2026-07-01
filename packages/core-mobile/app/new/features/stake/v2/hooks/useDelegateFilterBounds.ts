import { TokenUnit } from '@avalabs/core-utils-sdk'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useNodes } from 'hooks/earn/useNodes'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  getAvailableDelegationWeight,
  getStakingConfig
} from 'services/earn/utils'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const SECONDS_PER_DAY = 24 * 60 * 60
// `MinDelegationFee` is expressed in the [0, 1_000_000] permillion range.
const PERMILLION_PER_PERCENT = 10000
// Cap the fee slider well below the protocol max of 100% — real validators
// stay in the low single digits, so a 20% ceiling keeps the slider usable.
const MAX_FEE_PERCENT = 20

export type FilterBound = {
  min: number
  max: number
  step: number
}

export type DelegateFilterBounds = {
  uptime: FilterBound
  maxFee: FilterBound
  minAvailable: FilterBound
  minTimeRemaining: FilterBound
}

/**
 * Computes the slider bounds for the Delegate advanced filters. Static ranges
 * (uptime, fee, time) come from the staking config; the data-driven
 * availability range is derived from the fetched validators so the sliders
 * span the real spread of nodes.
 */
export const useDelegateFilterBounds = (): DelegateFilterBounds => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { minStakeAmount } = useStakingParams()
  const { data } = useNodes()
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)

  // Depend on primitives, not the `networkToken` / `minStakeAmount` objects, so
  // the validator loop below doesn't re-run when those get new identities on
  // unrelated renders.
  const tokenDecimals = networkToken.decimals
  const tokenSymbol = networkToken.symbol
  const minAvailableFloor = minStakeAmount.toDisplay({ asNumber: true })
  const validators = data?.validators

  return useMemo(() => {
    const config = getStakingConfig(isDeveloperMode)
    const minFee = Number(config.MinDelegationFee) / PERMILLION_PER_PERCENT
    const minDays = config.MinStakeDuration / SECONDS_PER_DAY
    const maxDays = Number(config.MaxStakeDuration) / SECONDS_PER_DAY

    let maxAvailable = 0
    for (const v of validators ?? []) {
      const available = getAvailableDelegationWeight({
        isDeveloperMode,
        validatorWeight: new TokenUnit(
          v.weight ?? 0,
          tokenDecimals,
          tokenSymbol
        ),
        delegatorWeight: new TokenUnit(
          v.delegatorWeight ?? 0,
          tokenDecimals,
          tokenSymbol
        )
      }).toDisplay({ asNumber: true })
      if (available > maxAvailable) maxAvailable = available
    }

    return {
      uptime: { min: 0, max: 100, step: 1 },
      maxFee: { min: minFee, max: MAX_FEE_PERCENT, step: 0.5 },
      minAvailable: {
        min: minAvailableFloor,
        // Guard against an empty list / all-min nodes so min < max always holds.
        max: Math.max(maxAvailable, minAvailableFloor + 1),
        step: 1
      },
      minTimeRemaining: {
        min: Math.floor(minDays),
        max: Math.ceil(maxDays),
        step: 1
      }
    }
  }, [
    isDeveloperMode,
    minAvailableFloor,
    validators,
    tokenDecimals,
    tokenSymbol
  ])
}
