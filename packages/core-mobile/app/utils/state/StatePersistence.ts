import { Persistor } from 'redux-persist'
import Logger from 'utils/Logger'
import { MMKV } from 'react-native-mmkv'
import { reduxStorage } from 'store/reduxStorage'
import { Store } from 'redux'

export class StatePersistence {
  private static persistor: Persistor | null = null
  private static store: Store | null = null
  private static debugStorage: MMKV
  private static readonly DEBUG_STORAGE_KEY = 'debug_state_snapshot'

  static setPersistor(persistor: Persistor): void {
    this.persistor = persistor
    this.debugStorage = new MMKV({
      id: 'debug_state'
    })
  }

  static setStore(store: Store): void {
    this.store = store
  }

  static async saveState(): Promise<void> {
    Logger.info('StatePersistence: Saving state')
    if (!this.persistor || !this.store) {
      Logger.error('StatePersistence: Persistor or store not initialized')
      return
    }
    try {
      // Get the persisted state from storage instead of store
      const persistedState = await reduxStorage.getItem('persist:root')
      if (!persistedState) {
        Logger.error('StatePersistence: No persisted state found')
        return
      }
      // Save the encrypted state to debug storage
      this.debugStorage.set(this.DEBUG_STORAGE_KEY, persistedState)
      Logger.info('StatePersistence: State saved successfully to debug storage')
    } catch (error) {
      Logger.error('StatePersistence: Failed to save state', error)
    }
  }

  static async loadState(): Promise<void> {
    Logger.info('StatePersistence: Loading state')
    if (!this.persistor) {
      Logger.error('StatePersistence: Persistor not initialized')
      return
    }

    try {
      const savedState = this.debugStorage.getString(this.DEBUG_STORAGE_KEY)
      if (!savedState) {
        Logger.error('StatePersistence: No saved state found in debug storage')
        return
      }
      // Pause normal persistence while we load our state
      this.persistor.pause()

      // Save the encrypted state back to the storage
      await reduxStorage.setItem('persist:root', savedState)

      // Trigger a rehydration
      this.persistor.persist()

      Logger.info(
        'StatePersistence: State loaded successfully from debug storage'
      )
    } catch (error) {
      Logger.error('StatePersistence: Failed to load state', error)
    }
  }

  static async proceedNormal(): Promise<void> {
    Logger.info('StatePersistence: Proceed normal state')
    if (!this.persistor) {
      Logger.error('StatePersistence: Persistor not initialized')
      return
    }

    try {
      this.persistor.persist()
    } catch (error) {
      Logger.error('StatePersistence: Failed to clear state', error)
    }
  }
}
