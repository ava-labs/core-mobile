import { getUnixTime } from 'date-fns'
import * as uuid from 'uuid'
import * as utils from 'utils/createHash'
import { combinedReducer as reducer } from '../combinedReducer'
import {
  addTab,
  removeTab,
  addHistoryForTab,
  removeAllTabs,
  setActiveTabId
} from './tabs'

jest.mock('uuid')

const uuidSpy = jest.spyOn(uuid, 'v4')
const creashHash = jest.spyOn(utils, 'createHash')

const initialState = {
  favorites: {
    entities: {},
    ids: []
  },
  globalHistory: {
    entities: {},
    ids: []
  },
  tabs: {
    entities: {},
    ids: []
  }
} as any

const TAB_HISTORY_DATA = {
  screenshot: 'https://www.google.com/screenshot.png',
  title: 'Google',
  url: 'https://www.google.com'
}

describe('reducer', () => {
  it('should handle initial state', () => {
    const state = reducer(undefined, { type: 'unknown' })
    expect(state).toMatchObject(initialState)
  })
})

describe('Tabs', () => {
  beforeEach(() => {
    uuidSpy.mockClear()
  })

  it('should add a new tab', () => {
    const currentState = initialState
    uuidSpy.mockImplementation(() => '1')
    const state = reducer(currentState, addTab())
    expect(state).toMatchObject({
      tabs: {
        activeTabId: '1',
        entities: {
          '1': {
            id: '1'
          }
        },
        ids: ['1']
      }
    })
  })

  it('should add two new tabs', () => {
    const currentState = initialState
    uuidSpy.mockImplementation(() => '1')
    const state1 = reducer(currentState, addTab())
    uuidSpy.mockImplementation(() => '2')
    const state = reducer(state1, addTab())

    expect(state).toMatchObject({
      tabs: {
        activeTabId: '2',
        entities: {
          '1': {
            id: '1'
          },
          '2': {
            id: '2'
          }
        },
        ids: ['1', '2']
      }
    })
  })

  it('should remove tab', () => {
    const currentState = initialState
    uuidSpy.mockImplementation(() => '1')
    const state1 = reducer(currentState, addTab())
    uuidSpy.mockImplementation(() => '2')
    const state2 = reducer(state1, addTab())
    const state = reducer(state2, removeTab({ id: '2' }))

    expect(state).toMatchObject({
      tabs: {
        activeTabId: '1',
        entities: {
          '1': {
            id: '1'
          }
        },
        ids: ['1']
      }
    })
  })

  it('should clear all tabs', () => {
    let state = initialState

    const times = 10
    for (let i = 0; i < times; i++) {
      uuidSpy.mockImplementation(() => `${i}`)
      state = reducer(state, addTab())
    }
    state = reducer(state, removeAllTabs())
    expect(state).toMatchObject(initialState)
  })

  it('should set active tab id', () => {
    let state = initialState

    const times = 10
    for (let i = 0; i < times; i++) {
      uuidSpy.mockImplementation(() => `${i}`)
      state = reducer(state, addTab())
    }
    state = reducer(state, setActiveTabId({ id: '3' }))
    expect(state.tabs.activeTabId).toEqual('3')
  })
})

describe('tab history', () => {
  beforeEach(() => {
    uuidSpy.mockClear()
  })

  it('should add a new history', () => {
    const currentState = initialState

    uuidSpy.mockImplementationOnce(() => '1')
    const unixTimestamp = getUnixTime(new Date('2023-10-26'))
    jest.useFakeTimers().setSystemTime(new Date('2023-10-26'))
    const state1 = reducer(currentState, addTab())
    creashHash.mockImplementation(() => 'history_1')
    const state = reducer(
      state1,
      addHistoryForTab({
        tabId: '1',
        history: TAB_HISTORY_DATA
      })
    )

    expect(state).toMatchObject({
      tabs: {
        activeTabId: '1',
        entities: {
          '1': {
            id: '1',
            lastVisited: unixTimestamp,
            historyIds: ['history_1']
          }
        },
        ids: ['1']
      },
      globalHistory: {
        entities: {
          history_1: {
            ...TAB_HISTORY_DATA,
            id: 'history_1'
          }
        },
        ids: ['history_1']
      }
    })
  })
})

it('should not add a new global history when tab is not found', () => {
  const currentState = initialState
  uuidSpy.mockImplementationOnce(() => '1')
  const state1 = reducer(currentState, addTab())
  creashHash.mockImplementationOnce(() => 'history_1')
  const state = reducer(
    state1,
    addHistoryForTab({
      tabId: 'unknown',
      history: TAB_HISTORY_DATA
    })
  )
  expect(state.tabs).toMatchObject({
    activeTabId: '1',
    entities: {
      '1': {
        id: '1'
      }
    },
    ids: ['1']
  })
  expect(state.globalHistory).toMatchObject({})
})
