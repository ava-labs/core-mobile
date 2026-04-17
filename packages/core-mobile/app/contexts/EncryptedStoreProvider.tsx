import React, { FC, PropsWithChildren, useEffect, useState } from 'react'
import Keychain from 'react-native-keychain'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { configureEncryptedStore } from 'store'
import Aes from 'react-native-aes-crypto'
import BootSplash from 'react-native-bootsplash'
import Logger from 'utils/Logger'

type EncryptionKey = string | null
const SERVICE_KEY = 'sec-store-provider'
const MAC_KEY = 'sec-store-provider-mac'
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000
const KEYCHAIN_TIMEOUT_MS = 8000

const withKeychainTimeout = <T,>(promise: Promise<T>): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Keychain timed out after ${KEYCHAIN_TIMEOUT_MS}ms`)),
        KEYCHAIN_TIMEOUT_MS
      )
    )
  ])

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
    let cancelled = false

    const tryInit = async (attempt: number): Promise<void> => {
      try {
        const encryptionKey = await getEncryptionKey()
        const macKey = await getMacKey()
        if (cancelled) return
        if (!encryptionKey || !macKey) {
          Logger.error(`EncryptedStoreProvider: encryption key or mac key is null/empty (attempt ${attempt})`)
          if (attempt < MAX_RETRIES) {
            setTimeout(() => tryInit(attempt + 1), RETRY_DELAY_MS)
          } else {
            Logger.error('EncryptedStoreProvider: all retries exhausted with null key, hiding splash')
            BootSplash.hide()
          }
          return
        }
        setEncryptedStore(configureEncryptedStore(encryptionKey, macKey))
      } catch (e) {
        Logger.error(`EncryptedStoreProvider: Keychain init failed (attempt ${attempt})`, e)
        if (cancelled) return
        if (attempt < MAX_RETRIES) {
          setTimeout(() => tryInit(attempt + 1), RETRY_DELAY_MS)
        } else {
          Logger.error('EncryptedStoreProvider: all retries exhausted, hiding splash')
          BootSplash.hide()
        }
      }
    }

    tryInit(1)

    return () => {
      cancelled = true
    }
  }, []) // only once!

  return encryptedStore
}

/**
 * Gets or creates the key used to encrypt the redux store.
 * @private
 */
const getEncryptionKey = async (): Promise<EncryptionKey> => {
  const existingCredentials = await withKeychainTimeout(
    Keychain.getGenericPassword({ service: SERVICE_KEY })
  )
  if (existingCredentials) {
    return existingCredentials.password
  }

  // Generate new credentials based on random string
  const key: string = await Aes.randomKey(32)
  const hasSetCredentials = await withKeychainTimeout(
    Keychain.setGenericPassword(SERVICE_KEY, key, { service: SERVICE_KEY })
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
  const existingCredentials = await withKeychainTimeout(
    Keychain.getGenericPassword({ service: MAC_KEY })
  )
  if (existingCredentials) {
    return existingCredentials.password
  }

  // Generate new credentials based on random string
  const key: string = await Aes.randomKey(32)
  const hasSetCredentials = await withKeychainTimeout(
    Keychain.setGenericPassword(MAC_KEY, key, { service: MAC_KEY })
  )
  if (hasSetCredentials) {
    return key
  }
  throw new Error('Error setting store mac key on Keychain')
}
