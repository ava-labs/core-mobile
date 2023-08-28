import { useNodes } from './useNodes'
import { usePeers } from './usePeers'

export const useNodesWithVersion = () => {
  const { data: nodes, error: useNodesError } = useNodes()
  const { data, isFetching, error } = usePeers(nodes?.validators ?? [])

  if (useNodesError) {
    return {
      data: undefined,
      isFetching: false,
      error: useNodesError
    }
  }
  if (isFetching) {
    return { data: nodes?.validators, isFetching: true, error: undefined }
  }
  if (error) {
    return { data: nodes?.validators, isFetching: false, error }
  }
  if (!data) {
    return { data: nodes?.validators, isFetching: false, error: undefined }
  }

  const nodesWithVersion = (nodes?.validators ?? []).map(validator => {
    const peer = data.peers.find(p => {
      return p.nodeID === validator.nodeID
    })
    return {
      ...validator,
      version: peer?.version ?? 'unknown'
    }
  })
  return { data: nodesWithVersion, isFetching: false, error: undefined }
}
