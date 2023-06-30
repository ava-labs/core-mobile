import Big from 'big.js'
import { calculateMaxWeight, truncateNodeId } from './Utils'

describe('/app/utils/Utils', () => {
  describe('truncateNodeId', () => {
    const nodeID = 'NodeID-9zPtXnScuWRvoiTDe498ZtjgoTXwTwxr9'
    it('returns the whole NodeId if size is bigger than length', () => {
      expect(truncateNodeId(nodeID, 33)).toBe(nodeID)
      expect(truncateNodeId(nodeID, 60)).toBe(nodeID)
    })

    it('truncates NodeId to correct length', () => {
      expect(truncateNodeId(nodeID)).toBe('NodeID-9zP...xr9')
      expect(truncateNodeId(nodeID, 10)).toBe('NodeID-9zPtX...Twxr9')
      expect(truncateNodeId(nodeID, 30)).toBe(
        'NodeID-9zPtXnScuWRvoiT...98ZtjgoTXwTwxr9'
      )
      expect(truncateNodeId(nodeID, 3)).toBe('NodeID-9z...9')
    })

    it('handles empty strings', () => {
      expect(truncateNodeId('')).toBe('')
    })

    it('handles <1 size', () => {
      expect(truncateNodeId(nodeID, 0)).toBe('NodeID-')
      expect(truncateNodeId(nodeID, -2)).toBe('NodeID-')
    })
  })
  describe('calculateMaxWeight', () => {
    it('returns the correct maxWeight and maxDelegation', () => {
      const maxValidatorStake = new Big(3000000e9)
      const stakeAmount = new Big('1900264376785214')

      const expectedMaxWeight = {
        maxDelegation: new Big('1099735623214786'),
        maxWeight: new Big(3000000e9)
      }
      expect(calculateMaxWeight(maxValidatorStake, stakeAmount)).toStrictEqual(
        expectedMaxWeight
      )
    })

    it('returns the correct maxWeight when stakeWeight is less than maxValidatorStake', () => {
      const maxValidatorStake = new Big(2000000e9)
      const stakeAmount = new Big('4376785214')

      const expectedMaxWeight = {
        maxDelegation: new Big('17507140856'),
        maxWeight: new Big('21883926070')
      }
      expect(calculateMaxWeight(maxValidatorStake, stakeAmount)).toStrictEqual(
        expectedMaxWeight
      )
    })
  })
})
