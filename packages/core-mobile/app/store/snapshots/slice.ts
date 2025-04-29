import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { SnapshotState, SnapshotTimestamp } from './types'

const reducerName = 'snapshots'

const initialState: SnapshotState = {
  timestamps: {}
}

const snapshotsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    updateSnapshotTimestamp: (
      state,
      action: PayloadAction<SnapshotTimestamp>
    ) => {
      state.timestamps[action.payload.id] = action.payload.timestamp
    },
    deleteSnapshotTimestamp: (
      state,
      action: PayloadAction<Omit<SnapshotTimestamp, 'timestamp'>>
    ) => {
      delete state.timestamps[action.payload.id]
    },
    deleteAllSnapshotTimestamps: state => {
      state.timestamps = {}
    }
  }
})

// selectors
export const selectAllSnapshotTimestamps = (
  state: RootState
): { [key: string]: number } => state.snapshots.timestamps

//actions
export const {
  updateSnapshotTimestamp,
  deleteSnapshotTimestamp,
  deleteAllSnapshotTimestamps
} = snapshotsSlice.actions

export const snapshotsReducer = snapshotsSlice.reducer
