import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { initialState, QuickSwapFeeLevel, QuickSwapMaxBuy } from './types'

const reducerName = 'advanced'

export const advancedSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    toggleDeveloperMode: state => {
      state.developerMode = !state.developerMode
    },
    toggleLeftHanded: state => {
      state.isLeftHanded = !state.isLeftHanded
    },
    setQuickSwapsEnabled: (state, action: PayloadAction<boolean>) => {
      state.quickSwaps.isEnabled = action.payload
    },
    setQuickSwapsFeeSetting: (
      state,
      action: PayloadAction<QuickSwapFeeLevel>
    ) => {
      state.quickSwaps.feeSetting = action.payload
    },
    setQuickSwapsMaxBuy: (state, action: PayloadAction<QuickSwapMaxBuy>) => {
      state.quickSwaps.maxBuy = action.payload
    },
    setFilterSmallUtxos: (state, action: PayloadAction<boolean>) => {
      state.filterSmallUtxos = action.payload
    }
  }
})

// selectors
export const selectIsDeveloperMode = (state: RootState): boolean =>
  state.settings.advanced.developerMode

export const selectIsLeftHanded = (state: RootState): boolean =>
  state.settings.advanced.isLeftHanded

export const selectIsQuickSwapsEnabled = (state: RootState): boolean =>
  state.settings.advanced.quickSwaps.isEnabled

export const selectQuickSwapsFeeSetting = (
  state: RootState
): QuickSwapFeeLevel => state.settings.advanced.quickSwaps.feeSetting

export const selectQuickSwapsMaxBuy = (state: RootState): QuickSwapMaxBuy =>
  state.settings.advanced.quickSwaps.maxBuy

export const selectFilterSmallUtxos = (state: RootState): boolean =>
  state.settings.advanced.filterSmallUtxos

// actions
export const {
  toggleDeveloperMode,
  toggleLeftHanded,
  setQuickSwapsEnabled,
  setQuickSwapsFeeSetting,
  setQuickSwapsMaxBuy,
  setFilterSmallUtxos
} = advancedSlice.actions

export const advancedReducer = advancedSlice.reducer
