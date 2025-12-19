import { NodeValidator } from 'types/earn'
import { useMemo } from 'react'

export function useGetValidatorByNodeId(
  validators: NodeValidator[] | undefined,
  nodeId: string | undefined
): NodeValidator | undefined {
  return useMemo(() => {
    if (validators && nodeId) {
      return validators.find(v => v.nodeID === nodeId)
    }
    return undefined
  }, [validators, nodeId])
}
