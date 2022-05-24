import { RootState } from 'store'

/**
 * Called when app rehydration is complete
 */
export interface OnStorageReady {
  onStorageReady(state: RootState): void
}
