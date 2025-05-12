import { truncateNodeId } from './Utils'

describe('/app/utils/Utils', () => {
  describe('truncateNodeId', () => {
    const nodeID = 'NodeID-9zPtXnScuWRvoiTDe498ZtjgoTXwTwxr9'
    it('returns the whole NodeId if size is bigger than length', () => {
      expect(truncateNodeId(nodeID, 33)).toBe(nodeID)
      expect(truncateNodeId(nodeID, 60)).toBe(nodeID)
    })

    it('truncates NodeId to correct length', () => {
      expect(truncateNodeId(nodeID)).toBe('NodeID-9zP…xr9')
      expect(truncateNodeId(nodeID, 10)).toBe('NodeID-9zPtX…Twxr9')
      expect(truncateNodeId(nodeID, 30)).toBe(
        'NodeID-9zPtXnScuWRvoiT…98ZtjgoTXwTwxr9'
      )
      expect(truncateNodeId(nodeID, 3)).toBe('NodeID-9z…9')
    })

    it('handles empty strings', () => {
      expect(truncateNodeId('')).toBe('')
    })

    it('handles <1 size', () => {
      expect(truncateNodeId(nodeID, 0)).toBe('NodeID-')
      expect(truncateNodeId(nodeID, -2)).toBe('NodeID-')
    })
  })
})
