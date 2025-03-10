import React, { FC, PropsWithChildren, useEffect, useState } from 'react'
import Keychain from 'react-native-keychain'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { configureEncryptedStore } from 'store'
import Aes from 'react-native-aes-crypto'

type EncryptionKey = string | null
const SERVICE_KEY = 'sec-store-provider'
const MAC_KEY = 'sec-store-provider-mac'

/**
 * Set up the encrypted redux store.
 */
export const EncryptedStoreProvider: FC<PropsWithChildren> = ({ children }) => {
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
const useEncryptedStore = (): ReturnType<
  typeof configureEncryptedStore
> | null => {
  const [encryptedStore, setEncryptedStore] = useState<ReturnType<
    typeof configureEncryptedStore
  > | null>(null)

  useEffect(() => {
    ;(async () => {
      const encryptionKey = await getEncryptionKey()
      const macKey = await getMacKey()
      if (!encryptionKey || !macKey) return
      setEncryptedStore(configureEncryptedStore(encryptionKey, macKey))
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
