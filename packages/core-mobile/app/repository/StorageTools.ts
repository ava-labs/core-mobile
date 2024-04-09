import Logger from 'utils/Logger'
import AsyncStorage from '@react-native-async-storage/async-storage'

class StorageTools {
  static async loadFromStorageAsMap<K, V>(key: string): Promise<Map<K, V>> {
    const raw = await AsyncStorage.getItem(key)
    return raw ? (new Map(JSON.parse(raw)) as Map<K, V>) : new Map<K, V>()
  }

  static async loadFromStorageAsObj<T>(key: string): Promise<T | undefined> {
    const raw = await AsyncStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  }

  static async loadFromStorageAsArray<T>(key: string): Promise<T[]> {
    const raw = await AsyncStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : ([] as T[])
  }

  static async saveMapToStorage<K, V>(
    key: string,
    map: Map<K, V>
  ): Promise<void> {
    const stringified = JSON.stringify([...map])
    if (stringified === undefined) {
      Logger.error('Could not stringify: ', map)
    } else {
      await AsyncStorage.setItem(key, stringified)
    }
  }

  static async saveToStorage<T>(key: string, obj: T | T[]): Promise<void> {
    const stringified = JSON.stringify(obj)
    if (stringified === undefined) {
      Logger.error('Could not stringify: ', obj)
    } else {
      await AsyncStorage.setItem(key, stringified)
    }
  }
}
export default StorageTools
