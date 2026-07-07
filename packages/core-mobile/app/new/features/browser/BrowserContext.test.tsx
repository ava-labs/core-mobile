import React from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import { useSelector, useDispatch } from 'react-redux'
import { addHistoryForActiveTab } from 'store/browser'
import { BrowserProvider, useBrowserContext } from './BrowserContext'

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn()
}))

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>

const activeTab = {
  id: 'tab-1',
  historyIds: [],
  activeHistoryIndex: -1,
  activeHistory: undefined,
  lastVisited: 0
}

describe('BrowserContext handleUrlSubmit', () => {
  const mockDispatch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDispatch.mockReturnValue(mockDispatch)
    mockUseSelector.mockReturnValue(activeTab)
  })

  const renderBrowserContext = (): ReturnType<typeof useBrowserContext> => {
    const wrapper = ({
      children
    }: {
      children: React.ReactNode
    }): React.JSX.Element => <BrowserProvider>{children}</BrowserProvider>
    const { result } = renderHook(() => useBrowserContext(), { wrapper })
    return result.current
  }

  // Reproduces the "first search does nothing, works on retry" bug: on the very
  // first submit the per-tab WebView ref (browserRefs.current[tab.id].current)
  // has not attached yet. Navigation must still be dispatched to Redux, because
  // the WebView is driven off the history entry — not the imperative ref.
  it('dispatches navigation on first submit even when the tab ref is not attached yet', () => {
    const ctx = renderBrowserContext()

    act(() => {
      ctx.handleUrlSubmit('hello world')
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      addHistoryForActiveTab({
        title: 'https://www.google.com/search?q=hello%20world',
        url: 'https://www.google.com/search?q=hello%20world'
      })
    )
  })

  it('dispatches navigation on first submit for a direct URL when the tab ref is not attached yet', () => {
    const ctx = renderBrowserContext()

    act(() => {
      ctx.handleUrlSubmit('example.com')
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      addHistoryForActiveTab({
        title: 'https://example.com',
        url: 'https://example.com'
      })
    )
  })
})
