import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'

const reducerName = 'seedless'

const initialState = {
  walletName: ''
}

const seedlessSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setWalletName: (state, action: PayloadAction<{ name: string }>) => {
      state.walletName = action.payload.name
    }
  }
})

// selectors
export const selectWalletName = (state: RootState): string =>
  state.seedless.walletName

export const { setWalletName } = seedlessSlice.actions

export const seedlessReducer = seedlessSlice.reducer
