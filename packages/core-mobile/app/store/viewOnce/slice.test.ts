import { viewOnceReducer as reducer, initialState, setViewOnce } from './slice'
import { ViewOnceKey } from './types'

describe('viewOnce reducer', () => {
  it('should handle initial state', () => {
    const state = reducer(undefined, {
      type: 'unknown'
    })

    expect(state).toEqual(initialState)
  })

  it('should handle setViewOnce', () => {
    const keyToTest = ViewOnceKey.CHART_INTERACTION
    const state = reducer(undefined, setViewOnce(keyToTest))

    expect(state).toStrictEqual({
      data: {
        [keyToTest]: true
      }
    })
  })

  it('should not update state with an invalid key', () => {
    const invalidKey = -1234235
    const state = reducer(initialState, setViewOnce(invalidKey as ViewOnceKey))

    expect(state).toStrictEqual(initialState)
  })
})
