import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { LoginAttempt, SecurityState } from './types'

const reducerName = 'security'

const initialState: SecurityState = {
  loginAttempt: {
    count: 0,
    timestamp: 0
  }
}

export const securitySlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setLoginAttempt: (state, action: PayloadAction<LoginAttempt>) => {
      state.loginAttempt = action.payload
    },
    resetLoginAttempt: state => {
      state.loginAttempt = {
        count: 0,
        timestamp: 0
      }
    }
  }
})

// selectors
export const selectLoginAttempt = (state: RootState) =>
  state.security.loginAttempt

// actions
export const { setLoginAttempt, resetLoginAttempt } = securitySlice.actions

export const securityReducer = securitySlice.reducer
