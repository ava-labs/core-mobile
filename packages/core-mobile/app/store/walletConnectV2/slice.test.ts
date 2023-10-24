import { walletConnectReducer as reducer, updateRequestStatus } from './slice'

const initialState = {
  requestStatuses: {}
}

describe('walletConnect - reducer', () => {
  it('should handle initial state', () => {
    const state = reducer(undefined, { type: 'unknown' })
    expect(state).toEqual(initialState)
  })

  describe('updateRequestStatus', () => {
    it('should save result', () => {
      const currentState = initialState
      const action = updateRequestStatus({
        id: 12,
        status: { result: 'some result' }
      })
      const state = reducer(currentState, action)

      expect(state).toEqual({
        requestStatuses: {
          12: { result: 'some result' }
        }
      })
    })

    it('should save error', () => {
      const currentState = initialState
      const testError = new Error('test error')
      const action = updateRequestStatus({
        id: 12,
        status: { error: testError }
      })
      const state = reducer(currentState, action)

      expect(state).toEqual({
        requestStatuses: {
          12: { error: testError }
        }
      })
    })

    it('should update result', () => {
      const currentState = {
        requestStatuses: {
          12: { result: 'some result' }
        }
      }
      const action = updateRequestStatus({
        id: 12,
        status: { result: 'some result 2' }
      })
      const state = reducer(currentState, action)

      expect(state).toEqual({
        requestStatuses: {
          12: { result: 'some result 2' }
        }
      })
    })

    it('should update error', () => {
      const currentState = {
        requestStatuses: {
          12: { error: new Error('test error') }
        }
      }

      const testError = new Error('test error 2')

      const action = updateRequestStatus({
        id: 12,
        status: { error: testError }
      })
      const state = reducer(currentState, action)

      expect(state).toEqual({
        requestStatuses: {
          12: { error: testError }
        }
      })
    })
  })
})
