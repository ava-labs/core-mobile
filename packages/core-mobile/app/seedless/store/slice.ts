import { createAction, createSlice } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { SeedlessState } from './types'

export const reducerName = 'seedless'

const initialState: SeedlessState = {
  hasTokenRefreshed: false
}

const slice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    onTokenRefreshed: state => {
      state.hasTokenRefreshed = true
    },
    resetTokenRefreshed: state => {
      state.hasTokenRefreshed = false
    }
  }
})

export const selectHasSeedlessTokenRefreshed = (state: RootState): boolean =>
  state.seedless.hasTokenRefreshed

export const onTokenExpired = createAction(`${reducerName}/onTokenExpired`)

export const { onTokenRefreshed, resetTokenRefreshed } = slice.actions

export const seedlessReducer = slice.reducer
