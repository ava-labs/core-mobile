import { useEffect, useState } from 'react'
import {
  hasMigratedFromAsyncStorage,
  migrateFromAsyncStorage
} from 'store/utils/mmkv'

export const useMigrateFromAsyncStorage = (): boolean | undefined => {
  const [hasMigrated, setHasMigrated] = useState(hasMigratedFromAsyncStorage)

  useEffect(() => {
    const runAsyncStorageMigration = async (): Promise<void> => {
      if (!hasMigratedFromAsyncStorage) {
        await migrateFromAsyncStorage()
        setHasMigrated(true)
      }
    }
    runAsyncStorageMigration()
  }, [])

  return hasMigrated
}
