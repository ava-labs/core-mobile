import { useNodes } from './useNodes'

export function useGetValidatorByNodeId(nodeId: string) {
  const { data } = useNodes()

  if (data) {
    return data.find(v => v.nodeID === nodeId)
  }
  return undefined
}
