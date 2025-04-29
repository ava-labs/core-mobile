import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { LoginAttempt, SecurityState } from './types'

const reducerName = 'security'

const initialState: SecurityState = {
  loginAttempt: {
    count: 0,
    countdown: 0
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
        countdown: 0
      }
    },
    decreaseCountdown: state => {
      state.loginAttempt = {
        count: state.loginAttempt.count,
        countdown:
          state.loginAttempt.countdown <= 0
            ? 0
            : state.loginAttempt.countdown - 1
      }
    }
  }
})

// selectors
export const selectLoginAttempt = (state: RootState): LoginAttempt =>
  state.security.loginAttempt

// actions
export const { setLoginAttempt, resetLoginAttempt, decreaseCountdown } =
  securitySlice.actions

export const securityReducer = securitySlice.reducer
