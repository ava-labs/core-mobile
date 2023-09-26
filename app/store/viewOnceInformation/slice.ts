import { createSlice } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { ViewOnceInformationState } from './types'

const initialState: ViewOnceInformationState = {
  items: []
}

const viewOnceInformationSlice = createSlice({
  name: 'viewOnceInformation',
  initialState,
  reducers: {
    setViewOnceInformation: (state, action) => {
      // we use set so we don't allow duplicates
      const newInfo = new Set(state.items)
      newInfo.add(action.payload)

      state.items = [...newInfo]
    },
    resetViewOnceInformation: state => {
      state.items = []
    }
  }
})

// selectors
export const selectViewOnceInformation = (state: RootState) =>
  state.viewOnceInformation.items

// actions
export const { setViewOnceInformation, resetViewOnceInformation } =
  viewOnceInformationSlice.actions

export const viewOnceInformationReducer = viewOnceInformationSlice.reducer
