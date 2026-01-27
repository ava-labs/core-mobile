import { RootState } from 'store/types'
import {
  nestEggReducer as reducer,
  initialState,
  setIsNewSeedlessUser,
  setHasSeenCampaign,
  setQualified,
  setHasAcknowledgedQualification,
  resetNestEggState,
  selectIsNewSeedlessUser,
  selectHasSeenNestEggCampaign,
  selectHasQualifiedForNestEgg,
  selectNestEggQualifiedAt,
  selectNestEggQualifyingTxHash,
  selectHasAcknowledgedNestEggQualification,
  selectIsNewSeedlessUserEligibleForNestEggModal,
  selectIsUserEligibleForNestEggModal,
  selectShouldShowNestEggSuccessModal
} from './slice'

describe('nestEgg reducer', () => {
  it('should handle initial state', () => {
    const state = reducer(undefined, { type: 'unknown' })
    expect(state).toEqual(initialState)
  })

  describe('setIsNewSeedlessUser', () => {
    it('should set isNewSeedlessUser to true', () => {
      const state = reducer(initialState, setIsNewSeedlessUser(true))
      expect(state.isNewSeedlessUser).toBe(true)
    })

    it('should set isNewSeedlessUser to false', () => {
      const prevState = { ...initialState, isNewSeedlessUser: true }
      const state = reducer(prevState, setIsNewSeedlessUser(false))
      expect(state.isNewSeedlessUser).toBe(false)
    })
  })

  describe('setHasSeenCampaign', () => {
    it('should set hasSeenCampaign to true', () => {
      const state = reducer(initialState, setHasSeenCampaign(true))
      expect(state.hasSeenCampaign).toBe(true)
    })

    it('should clear isNewSeedlessUser when setting hasSeenCampaign to true', () => {
      const prevState = { ...initialState, isNewSeedlessUser: true }
      const state = reducer(prevState, setHasSeenCampaign(true))
      expect(state.hasSeenCampaign).toBe(true)
      expect(state.isNewSeedlessUser).toBe(false)
    })

    it('should not clear isNewSeedlessUser when setting hasSeenCampaign to false', () => {
      const prevState = { ...initialState, isNewSeedlessUser: true }
      const state = reducer(prevState, setHasSeenCampaign(false))
      expect(state.hasSeenCampaign).toBe(false)
      expect(state.isNewSeedlessUser).toBe(true)
    })
  })

  describe('setQualified', () => {
    it('should set qualified state with txHash and timestamp', () => {
      const txHash = '0x123abc'
      const timestamp = 1706400000000
      const state = reducer(initialState, setQualified({ txHash, timestamp }))
      expect(state.hasQualified).toBe(true)
      expect(state.qualifiedAt).toBe(timestamp)
      expect(state.qualifyingTxHash).toBe(txHash)
    })
  })

  describe('setHasAcknowledgedQualification', () => {
    it('should set hasAcknowledgedQualification to true', () => {
      const state = reducer(initialState, setHasAcknowledgedQualification(true))
      expect(state.hasAcknowledgedQualification).toBe(true)
    })
  })

  describe('resetNestEggState', () => {
    it('should reset state to initial state', () => {
      const prevState = {
        isNewSeedlessUser: true,
        hasSeenCampaign: true,
        hasQualified: true,
        qualifiedAt: 1706400000000,
        qualifyingTxHash: '0x123',
        hasAcknowledgedQualification: true
      }
      const state = reducer(prevState, resetNestEggState())
      expect(state).toEqual(initialState)
    })
  })
})

describe('nestEgg selectors', () => {
  const createMockRootState = (nestEggState = initialState): RootState =>
    ({
      nestEgg: nestEggState
    } as RootState)

  describe('selectIsNewSeedlessUser', () => {
    it('should return isNewSeedlessUser value', () => {
      const state = createMockRootState({
        ...initialState,
        isNewSeedlessUser: true
      })
      expect(selectIsNewSeedlessUser(state)).toBe(true)
    })
  })

  describe('selectHasSeenNestEggCampaign', () => {
    it('should return hasSeenCampaign value', () => {
      const state = createMockRootState({
        ...initialState,
        hasSeenCampaign: true
      })
      expect(selectHasSeenNestEggCampaign(state)).toBe(true)
    })
  })

  describe('selectHasQualifiedForNestEgg', () => {
    it('should return hasQualified value', () => {
      const state = createMockRootState({ ...initialState, hasQualified: true })
      expect(selectHasQualifiedForNestEgg(state)).toBe(true)
    })
  })

  describe('selectNestEggQualifiedAt', () => {
    it('should return qualifiedAt value', () => {
      const timestamp = 1706400000000
      const state = createMockRootState({
        ...initialState,
        qualifiedAt: timestamp
      })
      expect(selectNestEggQualifiedAt(state)).toBe(timestamp)
    })

    it('should return null when not qualified', () => {
      const state = createMockRootState(initialState)
      expect(selectNestEggQualifiedAt(state)).toBeNull()
    })
  })

  describe('selectNestEggQualifyingTxHash', () => {
    it('should return qualifyingTxHash value', () => {
      const txHash = '0x123abc'
      const state = createMockRootState({
        ...initialState,
        qualifyingTxHash: txHash
      })
      expect(selectNestEggQualifyingTxHash(state)).toBe(txHash)
    })
  })

  describe('selectHasAcknowledgedNestEggQualification', () => {
    it('should return hasAcknowledgedQualification value', () => {
      const state = createMockRootState({
        ...initialState,
        hasAcknowledgedQualification: true
      })
      expect(selectHasAcknowledgedNestEggQualification(state)).toBe(true)
    })
  })

  describe('selectIsNewSeedlessUserEligibleForNestEggModal', () => {
    it('should return true when new seedless user, has not seen campaign, and has not qualified', () => {
      const state = createMockRootState({
        ...initialState,
        isNewSeedlessUser: true,
        hasSeenCampaign: false,
        hasQualified: false
      })
      expect(selectIsNewSeedlessUserEligibleForNestEggModal(state)).toBe(true)
    })

    it('should return false when not a new seedless user', () => {
      const state = createMockRootState({
        ...initialState,
        isNewSeedlessUser: false,
        hasSeenCampaign: false,
        hasQualified: false
      })
      expect(selectIsNewSeedlessUserEligibleForNestEggModal(state)).toBe(false)
    })

    it('should return false when has already seen campaign', () => {
      const state = createMockRootState({
        ...initialState,
        isNewSeedlessUser: true,
        hasSeenCampaign: true,
        hasQualified: false
      })
      expect(selectIsNewSeedlessUserEligibleForNestEggModal(state)).toBe(false)
    })

    it('should return false when has already qualified', () => {
      const state = createMockRootState({
        ...initialState,
        isNewSeedlessUser: true,
        hasSeenCampaign: false,
        hasQualified: true
      })
      expect(selectIsNewSeedlessUserEligibleForNestEggModal(state)).toBe(false)
    })
  })

  describe('selectIsUserEligibleForNestEggModal', () => {
    it('should return true when has not seen campaign and has not qualified', () => {
      const state = createMockRootState({
        ...initialState,
        hasSeenCampaign: false,
        hasQualified: false
      })
      expect(selectIsUserEligibleForNestEggModal(state)).toBe(true)
    })

    it('should return false when has already seen campaign', () => {
      const state = createMockRootState({
        ...initialState,
        hasSeenCampaign: true,
        hasQualified: false
      })
      expect(selectIsUserEligibleForNestEggModal(state)).toBe(false)
    })

    it('should return false when has already qualified', () => {
      const state = createMockRootState({
        ...initialState,
        hasSeenCampaign: false,
        hasQualified: true
      })
      expect(selectIsUserEligibleForNestEggModal(state)).toBe(false)
    })
  })

  describe('selectShouldShowNestEggSuccessModal', () => {
    it('should return true when qualified but not acknowledged', () => {
      const state = createMockRootState({
        ...initialState,
        hasQualified: true,
        hasAcknowledgedQualification: false
      })
      expect(selectShouldShowNestEggSuccessModal(state)).toBe(true)
    })

    it('should return false when not qualified', () => {
      const state = createMockRootState({
        ...initialState,
        hasQualified: false,
        hasAcknowledgedQualification: false
      })
      expect(selectShouldShowNestEggSuccessModal(state)).toBe(false)
    })

    it('should return false when qualified and acknowledged', () => {
      const state = createMockRootState({
        ...initialState,
        hasQualified: true,
        hasAcknowledgedQualification: true
      })
      expect(selectShouldShowNestEggSuccessModal(state)).toBe(false)
    })
  })
})
