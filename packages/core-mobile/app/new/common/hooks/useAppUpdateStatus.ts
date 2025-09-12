import { useEffect, useState } from 'react'
import {
  AppUpdateService,
  AppUpdateStatus
} from 'services/AppUpdateService/AppUpdateService'

export const useAppUpdateStatus = (): AppUpdateStatus | undefined => {
  const [appUpdateStatus, setAppUpdateStatus] = useState<AppUpdateStatus>()

  useEffect(() => {
    const checkForUpdate = async (): Promise<void> => {
      const status = await AppUpdateService.checkAppUpdateStatus()

      setAppUpdateStatus(status)
    }

    checkForUpdate()
  }, [])

  return appUpdateStatus
}
