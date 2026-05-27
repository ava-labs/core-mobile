import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { ChartType, initialState } from './types'

const reducerName = 'chartPreferences'

export const chartPreferencesSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setChartType: (state, action: PayloadAction<ChartType>) => {
      state.chartType = action.payload
    }
  }
})

export const { setChartType } = chartPreferencesSlice.actions
export const chartPreferencesReducer = chartPreferencesSlice.reducer

// selectors
export const selectChartType = (state: RootState): ChartType =>
  state.chartPreferences.chartType
