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
      state.data[action.payload] = true
    }
  }
})

// selectors
export const selectViewOnce = (state: RootState): ViewOnceObjectType =>
  state.viewOnce.data

// actions
export const { setViewOnce } = viewOnceSlice.actions

export const viewOnceReducer = viewOnceSlice.reducer
