import React, { FC, useEffect, useState } from 'react'
import Keychain from 'react-native-keychain'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { configureEncryptedStore } from 'store'
import { NativeModules } from 'react-native'

type EncryptionKey = { isNew: boolean; key: string | null }
const SERVICE_KEY = 'sec-store-provider'

/**
 * Set up the encrypted redux store.
 */
export const EncryptedStoreProvider: FC = ({ children }) => {
  const encryptedStore = useEncryptedStore()
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
const useEncryptedStore = () => {
  const [encryptedStore, setEncryptedStore] = useState<ReturnType<
    typeof configureEncryptedStore
  > | null>(null)

  useEffect(() => {
    ;(async () => {
      const encryptionKey = await getEncryptionKey()
      if (!encryptionKey.key) return
      setEncryptedStore(configureEncryptedStore(encryptionKey.key))
    })()
  }, []) // only once!

  return encryptedStore
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
    return { isNew: false, key: existingCredentials.password }
  }

  // Generate new credentials based on random string
  const key: string = await NativeModules.Aes.randomKey(32)
  const hasSetCredentials = await Keychain.setGenericPassword(
    SERVICE_KEY,
    key,
    { service: SERVICE_KEY }
  )
  if (hasSetCredentials) {
    return { isNew: true, key }
  }
  throw new Error('Error setting store password on Keychain')
}
