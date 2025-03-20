import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react'
import {
  ExportState,
  getConfirmCloseDelayText,
  getWaitingPeriodDescription,
  useSeedlessMnemonicExport
} from 'seedless/hooks/useSeedlessMnemonicExport'
import { useNavigation, useRouter } from 'expo-router'
import { showAlert } from '@avalabs/k2-alpine'
import { SeedlessExportInstructions } from 'features/accountSettings/components/SeedlessExportInstructions'
import { LoadingState } from 'common/components/LoadingState'
import Logger from 'utils/Logger'
import { SeedlessExportPending } from 'features/accountSettings/components/SeedlessExportPending'
import AnalyticsService from 'services/analytics/AnalyticsService'
import SeedlessService from 'seedless/services/SeedlessService'
import BackBarButton from 'common/components/BackBarButton'
import MnemonicScreen from 'features/onboarding/components/MnemonicPhrase'
import { copyToClipboard } from 'common/utils/clipboard'

const SeedlessExportPhraseScreen = (): JSX.Element => {
  const [keyId, setKeyId] = useState('')
  const { back, canGoBack } = useRouter()
  const { setOptions } = useNavigation()
  const [hideMnemonic, setHideMnemonic] = useState(true)

  const {
    state,
    progress,
    timeLeft,
    mnemonic,
    initExport,
    deleteExport,
    completeExport
  } = useSeedlessMnemonicExport(keyId)

  const onCancelExportRequest = useCallback(
    ({ title, description }: { title: string; description: string }): void => {
      showAlert({
        title,
        description,
        buttons: [
          {
            text: 'Next',
            style: 'default',
            onPress: deleteExport
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      })
    },
    [deleteExport]
  )

  const onInitExportRequest = (): void => {
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
  }

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

  useEffect(() => {
    const getKeyId = async (): Promise<void> => {
      const key = await SeedlessService.getMnemonicKeysList()
      key?.key_id && setKeyId(key.key_id)
    }
    getKeyId()
  }, [])

  const customGoBack = useCallback((): void => {
    switch (state) {
      case ExportState.ReadyToExport:
        onCancelExportRequest({
          title: 'Confirm Close?',
          description: getConfirmCloseDelayText()
        })
        break
      case ExportState.NotInitiated:
      case ExportState.Pending:
      default:
        canGoBack() && back()
        break
    }
  }, [back, canGoBack, onCancelExportRequest, state])

  const renderCustomBackButton = useCallback(
    () => <BackBarButton onBack={customGoBack} />,
    [customGoBack]
  )

  useLayoutEffect(() => {
    setOptions({
      headerLeft: renderCustomBackButton
    })
  }, [customGoBack, renderCustomBackButton, setOptions])

  return (
    <>
      {state === ExportState.Loading && <LoadingState />}
      {state === ExportState.NotInitiated && (
        <SeedlessExportInstructions onNext={onInitExportRequest} />
      )}
      {state === ExportState.Pending && (
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
      )}
      {state === ExportState.ReadyToExport && (
        <MnemonicScreen
          mnemonic={mnemonic}
          toggleRecoveryPhrase={toggleRecoveryPhrase}
          canToggleBlur={true}
          hideMnemonic={hideMnemonic || mnemonic === undefined}
          onCopyPhrase={handleCopyPhrase}
        />
      )}
    </>
  )
}

export default SeedlessExportPhraseScreen
