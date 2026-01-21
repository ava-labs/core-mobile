import React, { FC, PropsWithChildren, useEffect, useState } from 'react'
import Keychain from 'react-native-keychain'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { configureEncryptedStore } from 'store'
import Aes from 'react-native-aes-crypto'
import Logger from 'utils/Logger'

type EncryptionKey = string | null
const SERVICE_KEY = 'sec-store-provider'
const MAC_KEY = 'sec-store-provider-mac'

/**
 * Set up the encrypted redux store.
 */
export const EncryptedStoreProvider: FC<PropsWithChildren> = ({ children }) => {
  const { encryptedStore, error } = useEncryptedStore()

  if (error) {
    Logger.error('EncryptedStoreProvider failed to initialize', error)
    // Re-throw to let error boundary handle it
    throw error
  }

  if (!encryptedStore) return null

  return (
    <Provider store={encryptedStore.store}>
      <PersistGate loading={null} persistor={encryptedStore.persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}

/**
 * Memoize the store.
 * @private
 */
const useEncryptedStore = (): {
  encryptedStore: ReturnType<typeof configureEncryptedStore> | null
  error: Error | null
} => {
  const [encryptedStore, setEncryptedStore] = useState<ReturnType<
    typeof configureEncryptedStore
  > | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        Logger.info('EncryptedStoreProvider: Getting encryption keys...')
        const encryptionKey = await getEncryptionKey()
        const macKey = await getMacKey()
        if (!encryptionKey || !macKey) {
          throw new Error(
            'EncryptedStoreProvider: Failed to get encryption keys'
          )
        }
        Logger.info('EncryptedStoreProvider: Configuring encrypted store...')
        setEncryptedStore(configureEncryptedStore(encryptionKey, macKey))
      } catch (e) {
        Logger.error('EncryptedStoreProvider: Error initializing store', e)
        setError(e instanceof Error ? e : new Error(String(e)))
      }
    })()
  }, []) // only once!

  return { encryptedStore, error }
}

/**
 * Gets or creates the key used to encrypt the redux store.
 * @private
 */
const getEncryptionKey = async (): Promise<EncryptionKey> => {
  const existingCredentials = await Keychain.getGenericPassword({
    service: SERVICE_KEY
  })
  if (existingCredentials) {
    return existingCredentials.password
  }

  // Generate new credentials based on random string
  const key: string = await Aes.randomKey(32)
  const hasSetCredentials = await Keychain.setGenericPassword(
    SERVICE_KEY,
    key,
    { service: SERVICE_KEY }
  )
  if (hasSetCredentials) {
    return key
  }
  throw new Error('Error setting store password on Keychain')
}

/**
 * Gets or creates the key used to generate MAC for the redux store.
 * @private
 */
const getMacKey = async (): Promise<EncryptionKey> => {
  const existingCredentials = await Keychain.getGenericPassword({
    service: MAC_KEY
  })
  if (existingCredentials) {
    return existingCredentials.password
  }

  // Generate new credentials based on random string
  const key: string = await Aes.randomKey(32)
  const hasSetCredentials = await Keychain.setGenericPassword(MAC_KEY, key, {
    service: MAC_KEY
  })
  if (hasSetCredentials) {
    return key
  }
  throw new Error('Error setting store mac key on Keychain')
}
