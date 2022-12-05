import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { ApprovedAppMeta, DAppsState } from 'store/dApp/types'

const reducerName = 'dApp'

export const initialState = {
  approvedDApps: {}
} as DAppsState

const dAppSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setDApps: (state, action: PayloadAction<ApprovedAppMeta[]>) => {
      state.approvedDApps = action.payload
    },
    removeDApp: (
      state,
      action: PayloadAction<{
        peerId: string
      }>
    ) => {
      state.approvedDApps = state.approvedDApps.filter(
        value => value.peerId !== action.payload.peerId
      )
    }
  }
})

// selectors
export const selectApprovedDApps = (state: RootState) => {
  return Object.values(state.dApp.approvedDApps)
}

// actions
export const { removeDApp, setDApps } = dAppSlice.actions

export const dAppReducer = dAppSlice.reducer
