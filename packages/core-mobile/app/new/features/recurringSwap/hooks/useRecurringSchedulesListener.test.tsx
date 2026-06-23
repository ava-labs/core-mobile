import { renderHook } from '@testing-library/react-hooks'
import {
  configureStore,
  createListenerMiddleware,
  createSlice
} from '@reduxjs/toolkit'
import { QueryClient } from '@tanstack/react-query'
import React from 'react'
import { Provider } from 'react-redux'
import { onAppUnlocked } from 'store/app'
import { useRecurringSchedulesListener } from './useRecurringSchedulesListener'
import { RECURRING_SCHEDULES_QK } from './useRecurringSchedules'

// `useRecurringSchedulesListener` registers a Redux listener that
// invalidates the recurring-schedules query when the wallet unlocks. The
// banner observer mounted on Portfolio / Activity may not be aware of an
// unlock transition (which can land while `AppState` is already 'active'),
// so this listener is the only signal for the post-unlock refetch.
//
// Two cases to cover:
//   1. Dispatching `onAppUnlocked` after the hook is mounted invalidates
//      the recurring-schedules cache prefix.
//   2. The listener is unregistered on unmount (no invalidate after).

// Bare store with just the listener middleware. We don't need any real
// slices — the listener fires on `onAppUnlocked` regardless of reducer
// state, and we want the test to break if the hook starts depending on
// anything beyond the action being dispatched. Return type is intentionally
// inferred so the strongly-typed `dispatch` (which knows about
// `onAppUnlocked`) propagates to the call sites below — spelling it out
// fights `configureStore`'s generic-resolution and trips TS2349 on dispatch.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function makeStore() {
  const listenerMiddleware = createListenerMiddleware()
  const noop = createSlice({
    name: 'noop',
    initialState: {},
    reducers: {}
  })
  return configureStore({
    reducer: { noop: noop.reducer },
    middleware: getDefault =>
      getDefault().prepend(listenerMiddleware.middleware)
  })
}
type TestStore = ReturnType<typeof makeStore>

// prettier-ignore
// single-line destructured-arrow is the only TS-annotated arrow shape
// babel's preset accepts in test files here — see the sibling test for
// useRecurringSchedules for the same constraint.
const makeWrapper = (store: TestStore) =>
  function Wrapper({ children }: { children: React.ReactNode }): JSX.Element {
    return <Provider store={store}>{children}</Provider>
  }

describe('useRecurringSchedulesListener', () => {
  it('invalidates the recurring-schedules cache when onAppUnlocked fires', () => {
    const queryClient = new QueryClient()
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
    const store = makeStore()
    const wrapper = makeWrapper(store)

    renderHook(() => useRecurringSchedulesListener(queryClient), { wrapper })

    // Sanity: registering the listener must not invalidate by itself.
    expect(invalidate).not.toHaveBeenCalled()

    store.dispatch(onAppUnlocked())

    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: RECURRING_SCHEDULES_QK
    })
  })

  it('unsubscribes on unmount (no invalidate after teardown)', () => {
    const queryClient = new QueryClient()
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
    const store = makeStore()
    const wrapper = makeWrapper(store)

    const { unmount } = renderHook(
      () => useRecurringSchedulesListener(queryClient),
      { wrapper }
    )

    unmount()
    store.dispatch(onAppUnlocked())

    expect(invalidate).not.toHaveBeenCalled()
  })
})
