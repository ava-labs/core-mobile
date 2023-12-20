import { getUnixTime } from 'date-fns'
import * as utils from 'utils/createHash'
import {
  FavoriteState,
  History,
  TabId,
  TabPayload,
  TabState
} from 'store/browser/types'
import { CombinedState } from 'redux'
import { EntityState } from '@reduxjs/toolkit'
import { combinedReducer as reducer } from '../combinedReducer'
import {
  addTab,
  removeTab,
  addHistoryForActiveTab,
  removeAllTabs,
  setActiveTabId,
  getInitialState
} from './tabs'

let mockUuidCounter = 0
jest.mock('uuid', () => ({ v4: () => mockUuidCounter++ }))
const createHash = jest.spyOn(utils, 'createHash')

const initialState = {
  favorites: {
    entities: {},
    ids: []
  },
  globalHistory: {
    entities: {},
    ids: []
  },
  tabs: getInitialState()
} as CombinedState<{
  tabs: TabState
  globalHistory: EntityState<History>
  favorites: FavoriteState
}>

const TAB_HISTORY_DATA = {
  screenshot: 'https://www.google.com/screenshot.png',
  title: 'Google',
  url: 'https://www.google.com'
}

describe('reducer', () => {
  it('should handle initial state', () => {
    const state = reducer(undefined, { type: 'unknown' })
    expect(state.tabs.ids).toHaveLength(1)
    expect(state.tabs.activeTabId).toEqual(state.tabs.ids[0])
  })
})

describe('Tabs', () => {
  it('should have one tab initially', () => {
    const state = reducer(undefined, { type: 'unknown' })
    expect(state.tabs.ids).toHaveLength(1)
    expect(state.tabs.activeTabId).toEqual(state.tabs.ids[0])
  })

  it('should add a new tab', () => {
    const state = reducer(initialState, addTab())
    expect(state.tabs.ids).toHaveLength(2)
    expect(state.tabs.activeTabId).toEqual(state.tabs.ids[1])
  })

  it('should add two new tabs', () => {
    const state1 = reducer(initialState, addTab())
    const state = reducer(state1, addTab())
    expect(state.tabs.ids).toHaveLength(3)
    expect(state.tabs.activeTabId).toEqual(state.tabs.ids[2])
  })

  it('should remove tab', () => {
    const state1 = reducer(initialState, addTab())
    const state2 = reducer(state1, addTab())
    const state = reducer(
      state2,
      removeTab({ id: state2.tabs.ids[0] } as TabPayload)
    )
    expect(state.tabs.ids).toHaveLength(2)
    expect(state.tabs.activeTabId).toEqual(state.tabs.ids[1])
  })

  it('should clear all tabs', () => {
    let state = initialState
    const times = 10
    for (let i = 0; i < times; i++) {
      state = reducer(state, addTab())
    }
    expect(state.tabs.ids).toHaveLength(11)
    state = reducer(state, removeAllTabs())
    expect(state.tabs.ids).toHaveLength(1)
  })

  it('should set active tab id', () => {
    let state = initialState

    const times = 10
    let pickedId = ''
    for (let i = 0; i < times; i++) {
      state = reducer(state, addTab())
      if (i === 5) {
        pickedId = state.tabs.ids[state.tabs.ids.length - 1] as TabId
      }
    }
    state = reducer(state, setActiveTabId({ id: pickedId }))
    expect(state.tabs.activeTabId).toEqual(pickedId)
  })
})

describe('tab history', () => {
  it('should add a new history', () => {
    const unixTimestamp = getUnixTime(new Date('2023-10-26'))
    jest.useFakeTimers().setSystemTime(new Date('2023-10-26'))
    const state1 = reducer(initialState, addTab())
    createHash.mockImplementation(() => 'history_1')
    const state = reducer(state1, addHistoryForActiveTab(TAB_HISTORY_DATA))

    expect(state.tabs.ids).toHaveLength(2)
    expect(state.tabs.entities[state.tabs.activeTabId]?.lastVisited).toEqual(
      unixTimestamp
    )
    expect(state.tabs.entities[state.tabs.activeTabId]?.historyIds).toEqual([
      'history_1'
    ])
    expect(state.globalHistory.ids).toHaveLength(1)
    expect(state.globalHistory.entities.history_1).toMatchObject({
      ...TAB_HISTORY_DATA,
      id: 'history_1'
    })
  })
})
