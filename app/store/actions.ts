import { createAction } from '@reduxjs/toolkit'

// app lifecycle actions
export const onStorageReady = createAction<number | undefined>(
  'lifecycle/onStorageReady'
)
