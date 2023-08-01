import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { NotificationsState } from 'store/notifications/types'

const reducerName = 'notifications'

const initialState = {
  earn: false
} as NotificationsState

const notificationsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setNotificationsEarn: (state, action: PayloadAction<boolean>) => {
      state.earn = action.payload
    }
  }
})

// selectors
export const selectNotificationsEarn = (state: RootState) =>
  state.notifications.earn

export const { setNotificationsEarn } = notificationsSlice.actions

export const notificationsReducer = notificationsSlice.reducer
