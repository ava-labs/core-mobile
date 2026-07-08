import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getAvailableDelegationWeight } from 'services/earn/utils'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useDelegateNodeSelection } from '../store'

/**
 * Limits the amount + duration steps must honour for the node the user picked
 * in the advanced delegate flow (mirrors core-web, which caps the stake amount
 * by the validator's delegation capacity and the end date by its end time):
 *
 * - `maxAmount`: how much can still be delegated to the node.
 * - `maxEndDate`: the validator's end time — the stake can't outlast it.
 *
 * Returns empty values when no node is selected (e.g. Fast Stake, which passes
 * neither limit).
 */
export const useSelectedDelegateNodeLimits = (): {
  maxAmount?: TokenUnit
  maxEndDate?: Date
} => {
  const nodes = useDelegateNodeSelection(state => state.nodes)
  const index = useDelegateNodeSelection(state => state.index)
  const node = nodes[index]
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)

  return useMemo(() => {
    if (!node) return {}
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
  }, [node, networkToken, isDeveloperMode])
}
