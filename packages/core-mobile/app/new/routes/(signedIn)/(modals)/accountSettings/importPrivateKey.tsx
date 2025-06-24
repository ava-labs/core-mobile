import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  GroupList,
  Text,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenLogo } from 'common/components/TokenLogo'
import { usePrivateKeyBalance } from 'common/hooks/usePrivateKeyBalance'
import { SimpleTextInput } from 'new/common/components/SimpleTextInput'
import { useDeriveAddresses } from 'new/common/hooks/useDeriveAddresses'
import { useImportPrivateKey } from 'new/common/hooks/useImportPrivateKey'
import { usePrivateKeyImportHandler } from 'new/common/hooks/usePrivateKeyImportHandler'
import React, { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const ImportPrivateKeyScreen = (): JSX.Element => {
  const [privateKey, setPrivateKey] = useState('')

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { isImporting } = useImportPrivateKey()

  const { derivedAddresses, tempAccountDetails, showDerivedInfo } =
    useDeriveAddresses(privateKey, isDeveloperMode)

  const { totalBalanceDisplay, isAwaitingOurBalance } =
    usePrivateKeyBalance(tempAccountDetails)

  // Extract import handler logic
  const { handleImport, isCheckingMigration } = usePrivateKeyImportHandler(
    tempAccountDetails,
    privateKey
  )

  const renderFooter = useCallback(() => {
    return (
      <Button
        type="primary"
        size="large"
        onPress={handleImport}
        disabled={
          privateKey.trim() === '' ||
          isAwaitingOurBalance ||
          isCheckingMigration ||
          isImporting
        }>
        Import
      </Button>
    )
  }, [
    handleImport,
    isAwaitingOurBalance,
    isCheckingMigration,
    isImporting,
    privateKey
  ])

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
