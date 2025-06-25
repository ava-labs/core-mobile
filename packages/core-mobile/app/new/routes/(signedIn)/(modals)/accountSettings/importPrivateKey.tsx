import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  GroupList,
  showAlert,
  Text,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenLogo } from 'common/components/TokenLogo'
import { usePrivateKeyBalance } from 'common/hooks/usePrivateKeyBalance'
import { useCheckIfAccountExists } from 'common/hooks/useCheckIfAccountExists'
import { SimpleTextInput } from 'new/common/components/SimpleTextInput'
import { useDeriveAddresses } from 'new/common/hooks/useDeriveAddresses'
import { usePrivateKeyImportHandler } from 'new/common/hooks/usePrivateKeyImportHandler'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useCheckIfPrivateKeyWalletExists } from 'common/hooks/useCheckIfPrivateKeyWalletExists'
import Logger from 'utils/Logger'

const ImportPrivateKeyScreen = (): JSX.Element => {
  const [privateKey, setPrivateKey] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>()

  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const { derivedAddresses, tempAccountDetails, showDerivedInfo } =
    useDeriveAddresses(privateKey, isDeveloperMode)

  const { totalBalanceDisplay, isAwaitingOurBalance } =
    usePrivateKeyBalance(tempAccountDetails)

  // Extract import handler logic
  const { handleImport, isImporting, isCheckingMigration } =
    usePrivateKeyImportHandler(tempAccountDetails, privateKey)

  const checkIfAccountExists = useCheckIfAccountExists()
  const checkIfPrivateKeyWalletExists = useCheckIfPrivateKeyWalletExists()

  const handleImportPrivateKey = useCallback(() => {
    if (checkIfAccountExists(tempAccountDetails?.addressC)) {
      showAlert({
        title: 'Import Duplicate Account?',
        description:
          'This account has already been imported, do you want to continue?',
        buttons: [
          {
            text: 'Import',
            onPress: handleImport
          },
          {
            text: 'Cancel'
          }
        ]
      })
    } else {
      handleImport()
    }
  }, [handleImport, checkIfAccountExists, tempAccountDetails])

  const renderFooter = useCallback(() => {
    const disabled =
      privateKey.trim() === '' ||
      isAwaitingOurBalance ||
      isCheckingMigration ||
      isImporting ||
      !showDerivedInfo ||
      errorMessage !== undefined

    return (
      <Button
        type="primary"
        size="large"
        onPress={handleImportPrivateKey}
        disabled={disabled}>
        {isImporting ? <ActivityIndicator size="small" /> : 'Import'}
      </Button>
    )
  }, [
    handleImportPrivateKey,
    isAwaitingOurBalance,
    isCheckingMigration,
    isImporting,
    privateKey,
    showDerivedInfo,
    errorMessage
  ])

  useEffect(() => {
    if (derivedAddresses.length > 0) {
      checkIfPrivateKeyWalletExists(privateKey.trim())
        .then(exists => {
          if (exists) {
            setErrorMessage(
              'This private key appears to have already been imported.'
            )
          }
        })
        .catch(Logger.error)
    }
  }, [derivedAddresses, privateKey, checkIfPrivateKeyWalletExists])

  useEffect(() => {
    setErrorMessage(undefined)
  }, [privateKey])

  return (
    <ScrollScreen
      title="Import private key"
      isModal
      shouldAvoidKeyboard
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ gap: 12, paddingTop: 24 }}>
        <SimpleTextInput
          value={privateKey}
          onChangeText={setPrivateKey}
          placeholder="Enter private key"
          autoFocus
          secureTextEntry={true}
        />
        {errorMessage ? (
          <View sx={{ alignItems: 'center' }}>
            <Text variant="caption" sx={{ color: '$textDanger' }}>
              {errorMessage}
            </Text>
          </View>
        ) : undefined}

        {showDerivedInfo && (
          <View sx={{ gap: 12 }}>
            <GroupList
              data={derivedAddresses.map(item => ({
                title: (
                  <Text
                    variant="mono"
                    style={{
                      fontSize: 15
                    }}>
                    {truncateAddress(item.address, 16)}
                  </Text>
                ),
                leftIcon: <TokenLogo symbol={item.symbol} size={24} />
              }))}
            />

            <GroupList
              data={[
                {
                  title: 'Total balance',
                  value: isAwaitingOurBalance ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 16
                      }}>
                      {totalBalanceDisplay}
                    </Text>
                  )
                }
              ]}
            />
          </View>
        )}
      </View>
    </ScrollScreen>
  )
}

export default ImportPrivateKeyScreen
