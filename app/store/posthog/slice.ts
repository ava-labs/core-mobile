import { createSlice } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { v4 as uuidv4 } from 'uuid'
import { initialState } from './types'

const reducerName = 'posthog'

export const posthogSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    regenerateUserId: state => {
      state.userID = uuidv4()
    }
  }
})

// selectors
export const selectUserID = (state: RootState) => state.posthog.userID

// actions
export const { regenerateUserId } = posthogSlice.actions

export const posthogReducer = posthogSlice.reducer
