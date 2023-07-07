import { useNodes } from './query/useNodes'

export function useGetValidatorByNodeId(nodeId: string) {
  const { data } = useNodes()

  if (data?.validators) {
    return data.validators.find(v => v.nodeID === nodeId)
  }
  return undefined
}
