import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { AppStartListening } from 'store/types'
import { combinedReducer as browserReducer } from './combinedReducer'
import {
  addHistoryForActiveTab,
  goBackward,
  goForward,
  goToDiscoverPage
} from './slices/tabs'
import { addBrowserListener } from './listener'

const listenerMiddleware = createListenerMiddleware()

const setupStore = () => {
  listenerMiddleware.clearListeners()
  const store = configureStore({
    reducer: {
      browser: browserReducer
    },
    middleware: gDM =>
      gDM({
        serializableCheck: false
      }).prepend(listenerMiddleware.middleware)
  })

  addBrowserListener(listenerMiddleware.startListening as AppStartListening)

  return store
}

describe('browser listener', () => {
  it('goBackward/goForward move activeHistoryIndex and activeHistory', () => {
    const store = setupStore()

    store.dispatch(
      addHistoryForActiveTab({ title: 'A', url: 'https://example.com/a' })
    )
    store.dispatch(
      addHistoryForActiveTab({ title: 'B', url: 'https://example.com/b' })
    )

    let state = store.getState().browser
    expect(
      state.tabs.entities[state.tabs.activeTabId]?.activeHistoryIndex
    ).toBe(1)
    expect(
      state.tabs.entities[state.tabs.activeTabId]?.activeHistory?.url
    ).toBe('https://example.com/b')

    store.dispatch(goBackward())
    state = store.getState().browser
    expect(
      state.tabs.entities[state.tabs.activeTabId]?.activeHistoryIndex
    ).toBe(0)
    expect(
      state.tabs.entities[state.tabs.activeTabId]?.activeHistory?.url
    ).toBe('https://example.com/a')

    store.dispatch(goForward())
    state = store.getState().browser
    expect(
      state.tabs.entities[state.tabs.activeTabId]?.activeHistoryIndex
    ).toBe(1)
    expect(
      state.tabs.entities[state.tabs.activeTabId]?.activeHistory?.url
    ).toBe('https://example.com/b')
  })

  it('goToDiscoverPage sets activeHistoryIndex=-1 and clears activeHistory', () => {
    const store = setupStore()

    store.dispatch(
      addHistoryForActiveTab({ title: 'A', url: 'https://example.com/a' })
    )
    let state = store.getState().browser
    expect(
      state.tabs.entities[state.tabs.activeTabId]?.activeHistoryIndex
    ).toBe(0)

    store.dispatch(goToDiscoverPage())
    state = store.getState().browser
    expect(
      state.tabs.entities[state.tabs.activeTabId]?.activeHistoryIndex
    ).toBe(-1)
    expect(state.tabs.entities[state.tabs.activeTabId]?.activeHistory).toBe(
      undefined
    )
  })
})
