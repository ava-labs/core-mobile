import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getAvailableDelegationWeight } from 'services/earn/utils'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { NodeValidator } from 'types/earn'
import { useDelegateNodeSelection } from '../store'

/**
 * Computes the limits a delegation to `node` must honour (mirrors core-web,
 * which caps the stake amount by the validator's delegation capacity and the
 * end date by its end time):
 *
 * - `maxAmount`: how much can still be delegated to the node.
 * - `maxEndDate`: the validator's end time — the stake can't outlast it.
 *
 * Pure so both the selection-store hook below and the restake path (which
 * resolves its node from a fresh validators fetch instead of the store) can
 * share the math.
 */
export const getDelegateNodeLimits = (
  node: NodeValidator,
  isDeveloperMode: boolean
): { maxAmount: TokenUnit; maxEndDate: Date } => {
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const validatorWeight = new TokenUnit(
    node.weight ?? 0,
    networkToken.decimals,
    networkToken.symbol
  )
  const delegatorWeight = new TokenUnit(
    node.delegatorWeight ?? 0,
    networkToken.decimals,
    networkToken.symbol
  )
  return {
    maxAmount: getAvailableDelegationWeight({
      isDeveloperMode,
      validatorWeight,
      delegatorWeight
    }),
    maxEndDate: new Date(Number(node.endTime) * 1000)
  }
}

/**
 * `getDelegateNodeLimits` for the node the user picked in the advanced
 * delegate flow (held in the node-selection store). Returns empty values when
 * no node is selected (e.g. Fast Stake, which passes neither limit).
 */
export const useSelectedDelegateNodeLimits = (): {
  maxAmount?: TokenUnit
  maxEndDate?: Date
} => {
  const nodes = useDelegateNodeSelection(state => state.nodes)
  const index = useDelegateNodeSelection(state => state.index)
  const node = nodes[index]
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useMemo(() => {
    if (!node) return {}
    return getDelegateNodeLimits(node, isDeveloperMode)
  }, [node, isDeveloperMode])
}
