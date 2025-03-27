import React, { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { showAlert } from '@avalabs/k2-alpine'
import { SeedlessExportPending } from 'features/accountSettings/components/SeedlessExportPending'
import {
  EXPORT_DELAY,
  useSeedlessMnemonicExportContext
} from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { formatDistanceToNow } from 'date-fns'

const SeedlessExportPendingScreen = (): JSX.Element => {
  const [progress, setProgress] = useState(0)
  const [timeLeft, setTimeLeft] = useState('')
  const { back, canGoBack, replace } = useRouter()
  const { deleteExport, pendingRequest } = useSeedlessMnemonicExportContext()

  const onCancelExportRequest = useCallback(
    ({ title, description }: { title: string; description: string }): void => {
      showAlert({
        title,
        description,
        buttons: [
          {
            text: 'Next',
            style: 'default',
            onPress: async () => {
              await deleteExport()
              canGoBack() && back()
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      })
    },
    [back, canGoBack, deleteExport]
  )

  const updateProgress = useCallback(async () => {
    if (!pendingRequest) {
      return
    }

    const { valid_epoch: availableAt, exp_epoch: availableUntil } =
      pendingRequest

    const isInProgress = Date.now() / 1000 < availableAt

    const isReadyToDecrypt =
      Date.now() / 1000 >= availableAt && Date.now() / 1000 <= availableUntil
    const secondsPassed = EXPORT_DELAY - (availableAt - Date.now() / 1000)

    if (isInProgress) {
      setTimeLeft(formatDistanceToNow(new Date(availableAt * 1000)))
      setProgress(
        Math.min(Math.max(0, (secondsPassed / EXPORT_DELAY) * 100), 100)
      )
    } else if (isReadyToDecrypt) {
      setTimeout(() => {
        replace('./readyToExport')
      }, 100)
    } else {
      await deleteExport()
    }
  }, [deleteExport, pendingRequest, replace])

  useEffect(() => {
    updateProgress()
    const timer = setInterval(updateProgress, 5000)
    return () => {
      clearInterval(timer)
    }
  }, [pendingRequest, updateProgress])

  return (
    <SeedlessExportPending
      timeLeft={timeLeft}
      onCancel={() =>
        onCancelExportRequest({
          title: 'Confirm Cancel?',
          description:
            'Canceling will require you to restart the 2 day waiting period.'
        })
      }
      progress={progress}
    />
  )
}

export default SeedlessExportPendingScreen
