import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { RootState } from 'store'
import {
  ViewOnceInformationKey,
  ViewOnceInformationState,
  ViewOnceObjectType
} from './types'

export const initialState: ViewOnceInformationState = {
  data: {} as ViewOnceObjectType
}

const viewOnceInformationSlice = createSlice({
  name: 'viewOnceInformation',
  initialState,
  reducers: {
    setViewOnceInformation: (
      state,
      action: PayloadAction<ViewOnceInformationKey>
    ) => {
      state.data[action.payload] = true
    }
  }
})

// selectors
export const selectViewOnceInformation = (
  state: RootState
): ViewOnceObjectType => state.viewOnceInformation.data

// actions
export const { setViewOnceInformation } = viewOnceInformationSlice.actions

export const viewOnceInformationReducer = viewOnceInformationSlice.reducer
