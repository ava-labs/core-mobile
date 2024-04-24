import { useEffect, useState } from 'react'
import {
  hasMigratedFromAsyncStorage,
  migrateFromAsyncStorage
} from 'utils/mmkv'

export const useMigrateFromAsyncStorage = (): boolean | undefined => {
  const [hasMigrated, setHasMigrated] = useState(hasMigratedFromAsyncStorage())

  useEffect(() => {
    const runAsyncStorageMigration = async (): Promise<void> => {
      if (!hasMigrated) {
        await migrateFromAsyncStorage()
        setHasMigrated(true)
      }
    }
    runAsyncStorageMigration()
  }, [hasMigrated])

  return hasMigrated
}
