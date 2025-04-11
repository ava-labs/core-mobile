import { NodeValidator } from 'types/earn'
import { useNodes } from './useNodes'

export function useGetValidatorByNodeId(
  nodeId: string | undefined
): NodeValidator | undefined {
  const { data } = useNodes()

  if (data?.validators && nodeId) {
    return data.validators.find(v => v.nodeID === nodeId)
  }
  return undefined
}
