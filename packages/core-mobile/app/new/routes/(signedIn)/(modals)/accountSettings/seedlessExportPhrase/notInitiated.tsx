import React, { useCallback } from 'react'
import { showAlert } from '@avalabs/k2-alpine'
import { SeedlessExportInstructions } from 'features/accountSettings/components/SeedlessExportInstructions'
import Logger from 'utils/Logger'
import {
  getWaitingPeriodDescription,
  useSeedlessMnemonicExportContext
} from 'features/accountSettings/context/SeedlessMnemonicExportProvider'

const SeedlessExportNotInitiatedScreen = (): JSX.Element => {
  const { initExport } = useSeedlessMnemonicExportContext()

  const onInitExportRequest = useCallback((): void => {
    showAlert({
      title: 'Waiting Period',
      description: getWaitingPeriodDescription(),
      buttons: [
        {
          text: 'Next',
          style: 'default',
          onPress: () => initExport().catch(Logger.error)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    })
  }, [initExport])

  return <SeedlessExportInstructions onNext={onInitExportRequest} />
}

export default SeedlessExportNotInitiatedScreen
