import assert from 'assert'
import Keychain from 'react-native-keychain'
import Aes from 'react-native-aes-crypto'
import { decrypt, encrypt } from 'utils/EncryptionHelper'
import { serializeJson } from 'utils/serialization/serialize'
import { deserializeJson } from 'utils/serialization/deserialize'

export enum KeySlot {
  SignerSessionData = 'SignerSessionData',
  SeedlessPubKeys = 'SeedlessPubKeysNew',
  OidcProvider = 'OidcProvider',
  OidcUserId = 'OidcUserId'
}

/**
 * SecurityService provides way to store and load anything using Keychain.
 * Storage is divided into <b>slots</b>, so when you want to load/store something you provide one of enumed slots
 * (add to enum if needed).
 * Data is firstly encrypted then stored into Keychain under name "ss_value_${slot}", and encryption key is stored under
 * "ss_key_${slot}".
 *
 * Values stored should be reasonable small
 */
class SecureStorageService {
  /**
   * Encrypts and stores value to secured storage for given slot.
   * Throws error if Keychain fails.
   * @param slot - Slot under which to store
   * @param value - Any JSON
   */
  async store(slot: KeySlot, value: unknown): Promise<void> {
    const serviceForValues = `ss_value_${slot}`
    const serialized = serializeJson(value)
    const key = await SecureStorageService.getOrCreateKey(slot)
    const encrypted = await encrypt(serialized, key)
    const result = await Keychain.setGenericPassword(
      serviceForValues,
      encrypted,
      {
        service: serviceForValues
      }
    )
    assert(result !== false)
  }

  /**
   * Loads end decrypts data for given slot or throws error.
   * @param slot - Slot from which to load
   * @throws Error if no value is found for given slot
   */
  async load<T>(slot: KeySlot): Promise<T> {
    const serviceForValues = `ss_value_${slot}`
    const key = await SecureStorageService.getOrCreateKey(slot)
    const result = await Keychain.getGenericPassword({
      service: serviceForValues
    })
    assert(result !== false)
    const decrypted = await decrypt(result.password, key)
    const stringified = decrypted.data
    return deserializeJson<T>(stringified)
  }

  async clearAll(): Promise<void> {
    const promises: Promise<boolean>[] = []
    Object.values(KeySlot).forEach(slot => {
      promises.push(
        Keychain.resetGenericPassword({
          service: `ss_value_${slot}`
        })
      )
      promises.push(
        Keychain.resetGenericPassword({
          service: `ss_key_${slot}`
        })
      )
    })
    await Promise.allSettled(promises)
  }

  private static async getOrCreateKey(slot: KeySlot): Promise<string> {
    const serviceForKeys = `ss_key_${slot}`
    const existingCredentials = await Keychain.getGenericPassword({
      service: serviceForKeys
    })
    if (existingCredentials) {
      return existingCredentials.password
    }
    const key: string = await Aes.randomKey(32)
    const result = await Keychain.setGenericPassword(serviceForKeys, key, {
      service: serviceForKeys
    })
    assert(result !== false)
    return key
  }
}

export default new SecureStorageService()
