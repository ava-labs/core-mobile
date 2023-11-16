import assert from 'assert'
import Keychain from 'react-native-keychain'
import { NativeModules } from 'react-native'
import { decrypt, encrypt } from 'utils/EncryptionHelper'
import { serializeToJSON } from 'utils/serialization/serialize'
import { deserializeFromJSON } from 'utils/serialization/deserialize'

export enum KeySlot {
  SeedlessSessionStorage = 'SeedlessSessionStorage'
}

class SecurityService {
  /**
   * Encrypts and stores value to secured storage for given slot.
   * Throws error.
   * @param slot
   * @param value
   */
  async store(slot: KeySlot, value: unknown): Promise<void> {
    const serviceForValues = `ss_value_${slot}`
    const serialized = serializeToJSON(value)
    const key = await SecurityService.getOrCreateKey(slot)
    const encrypted = await encrypt(serialized, key)
    const result = await Keychain.setGenericPassword('', encrypted, {
      service: serviceForValues
    })
    assert(result !== false)
  }

  /**
   * Loads end decrypts data for given slot or throws error.
   * @param slot
   */
  async load<T>(slot: KeySlot): Promise<T> {
    const serviceForValues = `ss_value_${slot}`
    const key = await SecurityService.getOrCreateKey(slot)
    const result = await Keychain.getGenericPassword({
      service: serviceForValues
    })
    assert(result !== false)
    const decrypted = await decrypt(result.password, key)
    const stringified = decrypted.data
    return deserializeFromJSON<T>(stringified)
  }

  private static async getOrCreateKey(slot: KeySlot): Promise<string> {
    const serviceForKeys = `ss_key_${slot}`
    const existingCredentials = await Keychain.getGenericPassword({
      service: serviceForKeys
    })
    if (existingCredentials) {
      existingCredentials.password
    }
    const key: string = await NativeModules.Aes.randomKey(32)
    const result = await Keychain.setGenericPassword('', key, {
      service: serviceForKeys
    })
    assert(result !== false)
    return key
  }
}

export default new SecurityService()
