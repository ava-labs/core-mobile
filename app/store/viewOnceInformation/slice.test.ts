import {
  viewOnceInformationReducer as reducer,
  initialState,
  setViewOnceInformation
} from './slice'
import { ViewOnceInformationKey } from './types'

describe('viewOnceInformation reducer', () => {
  it('should handle initial state', () => {
    const state = reducer(undefined, {
      type: 'unknown'
    })

    expect(state).toEqual(initialState)
  })

  it('should handle setViewOnceInformation', () => {
    const keyToTest = ViewOnceInformationKey.CHART_INTERACTION
    const state = reducer(undefined, setViewOnceInformation(keyToTest))

    expect(state).toStrictEqual({
      data: {
        [keyToTest]: true
      }
    })
  })
})
