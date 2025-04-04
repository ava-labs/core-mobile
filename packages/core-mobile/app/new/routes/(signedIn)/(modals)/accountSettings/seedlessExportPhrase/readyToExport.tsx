import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react'
import { useRouter } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import { showAlert } from '@avalabs/k2-alpine'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import BackBarButton from 'common/components/BackBarButton'
import { copyToClipboard } from 'common/utils/clipboard'
import {
  getConfirmCloseDelayText,
  useSeedlessMnemonicExportContext
} from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { SeedlessExportMnemonicPhrase } from 'features/accountSettings/components/SeedlessExportMnemonicPhrase'

const SeedlessExportReadyScreen = (): JSX.Element => {
  const { back, canGoBack } = useRouter()
  const { deleteExport, completeExport, mnemonic } =
    useSeedlessMnemonicExportContext()
  const { setOptions, getParent } = useNavigation()
  const [hideMnemonic, setHideMnemonic] = useState(true)

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
              canGoBack() && back()
              await deleteExport()
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

  const toggleRecoveryPhrase = useCallback(async (): Promise<void> => {
    if (mnemonic === undefined) {
      await completeExport().catch(Logger.error)
    }
    setHideMnemonic(prev => !prev)
    AnalyticsService.capture(
      hideMnemonic !== true // state hasn't updated yet
        ? 'SeedlessExportPhraseHidden'
        : 'SeedlessExportPhraseRevealed'
    )
  }, [completeExport, hideMnemonic, mnemonic])

  const handleCopyPhrase = useCallback((): void => {
    AnalyticsService.capture('SeedlessExportPhraseCopied')
    copyToClipboard(mnemonic, 'Phrase Copied!')
  }, [mnemonic])

  useEffect(() => {
    mnemonic && setHideMnemonic(false)
  }, [mnemonic])

  const customGoBack = useCallback((): void => {
    onCancelExportRequest({
      title: 'Confirm Close?',
      description: getConfirmCloseDelayText()
    })
  }, [onCancelExportRequest])

  const renderCustomBackButton = useCallback(
    () => <BackBarButton onBack={customGoBack} />,
    [customGoBack]
  )

  useLayoutEffect(() => {
    getParent()?.setOptions({
      headerLeft: renderCustomBackButton
    })
  }, [customGoBack, getParent, renderCustomBackButton, setOptions])

  return (
    <SeedlessExportMnemonicPhrase
      mnemonic={mnemonic}
      toggleRecoveryPhrase={toggleRecoveryPhrase}
      hideMnemonic={hideMnemonic || mnemonic === undefined}
      onCopyPhrase={handleCopyPhrase}
    />
  )
}

export default SeedlessExportReadyScreen
