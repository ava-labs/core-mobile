import React, { useState, useCallback, useEffect } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { showAlert, View } from '@avalabs/k2-alpine'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import BackBarButton from 'common/components/BackBarButton'
import { copyToClipboard } from 'common/utils/clipboard'
import {
  getConfirmCloseDelayText,
  useSeedlessMnemonicExportContext
} from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { Platform } from 'react-native'
import { SeedlessExportMnemonicPhrase } from 'features/accountSettings/components/SeedlessExportMnemonicPhrase'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

const SeedlessExportReadyScreen = (): JSX.Element => {
  const { back, canGoBack } = useDebouncedRouter()
  const { deleteExport, completeExport, mnemonic } =
    useSeedlessMnemonicExportContext()
  const { getParent } = useNavigation()
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
    () => (
      <View
        sx={{
          marginLeft: Platform.OS === 'android' ? 12 : 0
        }}>
        <BackBarButton onBack={customGoBack} />
      </View>
    ),
    [customGoBack]
  )

  useFocusEffect(
    useCallback(() => {
      getParent()?.setOptions({
        headerLeft: renderCustomBackButton
      })

      return () => {
        getParent()?.setOptions({
          headerLeft: undefined
        })
      }
    }, [getParent, renderCustomBackButton])
  )

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
