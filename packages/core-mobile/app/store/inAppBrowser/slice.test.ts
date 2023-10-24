import { subDays } from 'date-fns'
import * as uuid from 'uuid'
import {
  inAppBrowserReducer as reducer,
  addTab,
  removeTab,
  addHistory,
  limitMaxHistory,
  clearAllTabs,
  setActiveTabId
} from './slice'
import { InAppBrowserState } from './types'

jest.mock('uuid')
const uuidSpy = jest.spyOn(uuid, 'v4')

const initialState = { activeTabId: undefined, entities: {}, ids: [] }

const TAB_DATA_1 = {
  lastVisited: subDays(new Date(), 1),
  screenshot: 'https://www.google.com/screenshot.png',
  title: 'Google',
  active: 'https://www.google.com',
  history: ['https://www.google.com']
}

const TAB_DATA_2 = {
  lastVisited: subDays(new Date(), 2),
  screenshot: 'https://www.apple.com/screenshot.png',
  title: 'Apple',
  active: 'https://www.apple.com',
  history: ['https://www.apple.com']
}

describe('reducer', () => {
  it('should handle initial state', () => {
    const state = reducer(undefined, { type: 'unknown' })
    expect(state).toEqual(initialState)
  })
})

describe('Tabs', () => {
  beforeEach(() => {
    uuidSpy.mockClear()
  })

  it('should add a new tab', () => {
    const currentState = initialState
    uuidSpy.mockImplementation(() => '1')
    const state = reducer(currentState, addTab({ ...TAB_DATA_1 }))

    expect(state).toEqual({
      activeTabId: '1',
      entities: {
        ['1']: {
          ...TAB_DATA_1,
          id: '1'
        }
      },
      ids: ['1']
    })
  })

  it('should add two new tabs', () => {
    const currentState = initialState
    uuidSpy.mockImplementation(() => '1')
    const state1 = reducer(currentState, addTab({ ...TAB_DATA_1 }))
    uuidSpy.mockImplementation(() => '2')
    const state = reducer(state1, addTab({ ...TAB_DATA_2 }))

    expect(state).toEqual({
      activeTabId: '2',
      entities: {
        ['1']: {
          ...TAB_DATA_1,
          id: '1'
        },
        ['2']: {
          ...TAB_DATA_2,
          id: '2'
        }
      },
      ids: ['1', '2']
    })
  })

  it('should remove tab', () => {
    const currentState = initialState
    uuidSpy.mockImplementation(() => '1')
    const state1 = reducer(currentState, addTab({ ...TAB_DATA_1 }))
    uuidSpy.mockImplementation(() => '2')
    const state2 = reducer(state1, addTab({ ...TAB_DATA_2 }))
    const state = reducer(state2, removeTab({ id: '2' }))

    expect(state).toEqual({
      activeTabId: '2',
      entities: {
        ['1']: {
          ...TAB_DATA_1,
          id: '1'
        }
      },
      ids: ['1']
    })
  })

  it('should clear all tabs', () => {
    let state: InAppBrowserState = initialState

    const times = 10
    for (let i = 0; i < times; i++) {
      uuidSpy.mockImplementation(() => `${i}`)
      state = reducer(state, addTab({ ...TAB_DATA_1 }))
    }
    state = reducer(state, clearAllTabs())
    expect(state).toEqual(initialState)
  })

  it('should set active tab id', () => {
    let state: InAppBrowserState = initialState

    const times = 10
    for (let i = 0; i < times; i++) {
      uuidSpy.mockImplementation(() => `${i}`)
      state = reducer(state, addTab({ ...TAB_DATA_1 }))
    }
    state = reducer(state, setActiveTabId({ id: '3' }))
    expect(state.activeTabId).toEqual('3')
  })
})

describe('tab history', () => {
  beforeEach(() => {
    uuidSpy.mockClear()
  })

  it('should add a new history', () => {
    const currentState = initialState
    uuidSpy.mockImplementation(() => '1')
    const state1 = reducer(currentState, addTab({ ...TAB_DATA_1 }))
    const state = reducer(
      state1,
      addHistory({ id: '1', historyId: 'https://www.google.com/history/1' })
    )

    expect(state).toEqual({
      activeTabId: '1',
      entities: {
        ['1']: {
          ...TAB_DATA_1,
          id: '1',
          history: [
            'https://www.google.com',
            'https://www.google.com/history/1'
          ],
          active: 'https://www.google.com/history/1'
        }
      },
      ids: ['1']
    })
  })
  it('should limit history count to max of 20', () => {
    const currentState = initialState

    uuidSpy.mockImplementation(() => '1')
    let state = reducer(currentState, addTab({ ...TAB_DATA_1 }))

    const times = 20
    for (let i = 0; i < times; i++) {
      state = reducer(
        state,
        addHistory({
          id: '1',
          historyId: `https://www.google.com/history/${i}`
        })
      )
    }
    state = reducer(state, limitMaxHistory({ id: '1' }))
    expect(state.entities['1']?.history.length).toEqual(20)
  })
})
