import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { ViewOnceKey, ViewOnceState, ViewOnceObjectType } from './types'

export const initialState: ViewOnceState = {
  data: {} as ViewOnceObjectType
}

const viewOnceSlice = createSlice({
  name: 'viewOnce',
  initialState,
  reducers: {
    setViewOnce: (state, action: PayloadAction<ViewOnceKey>) => {
      if (Object.values(ViewOnceKey).includes(action.payload)) {
        state.data[action.payload] = true
      }
    },
    resetViewOnce: (state, action: PayloadAction<ViewOnceKey>) => {
      if (Object.values(ViewOnceKey).includes(action.payload)) {
        state.data[action.payload] = false
      }
    }
  }
})

// selectors
export const selectHasBeenViewedOnce =
  (key: ViewOnceKey) =>
  (state: RootState): boolean =>
    state.viewOnce.data[key] === true

// actions
export const { setViewOnce, resetViewOnce } = viewOnceSlice.actions

export const viewOnceReducer = viewOnceSlice.reducer
