import React, { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { showAlert } from '@avalabs/k2-alpine'
import { SeedlessExportPending } from 'features/accountSettings/components/SeedlessExportPending'
import {
  EXPORT_DELAY,
  getConfirmCancelDelayText,
  useSeedlessMnemonicExportContext
} from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { formatExportPhraseDuration } from 'features/accountSettings/utils/formatExportPhraseDuration'
import { getExportInitProgress } from 'features/accountSettings/utils/getExportInitProgress'

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

    const { isInProgress, isReadyToDecrypt } = getExportInitProgress(
      availableAt,
      availableUntil
    )
    const secondsPassed = EXPORT_DELAY - (availableAt - Date.now() / 1000)

    if (isInProgress) {
      setTimeLeft(formatExportPhraseDuration(availableAt * 1000))
      setProgress(
        Math.min(Math.max(0, (secondsPassed / EXPORT_DELAY) * 100), 100)
      )
    } else if (isReadyToDecrypt) {
      setTimeout(() => {
        // @ts-ignore TODO: make routes typesafe
        replace('/accountSettings/seedlessExportPhrase/readyToExport')
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
          description: getConfirmCancelDelayText()
        })
      }
      progress={progress}
    />
  )
}

export default SeedlessExportPendingScreen
