import React, { useState } from 'react'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { View, Text, useTheme, ActivityIndicator } from '@avalabs/k2-alpine'
import { SimpleTextInput } from 'new/common/components/SimpleTextInput'
import { Button } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { TokenLogo } from 'common/components/TokenLogo'
import { useImportPrivateKey } from 'new/common/hooks/useImportPrivateKey'
import { useDeriveAddresses } from 'new/common/hooks/useDeriveAddresses'
import { usePrivateKeyBalance } from 'common/hooks/usePrivateKeyBalance'
import { usePrivateKeyImportHandler } from 'new/common/hooks/usePrivateKeyImportHandler'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const ImportPrivateKeyScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
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

  return (
    <ScrollScreen
      title="Import private key"
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ flex: 1, justifyContent: 'space-between' }}>
        <View sx={{ gap: 24 }}>
          <SimpleTextInput
            value={privateKey}
            onChangeText={setPrivateKey}
            placeholder="Enter private key"
            autoFocus
            secureTextEntry={true}
          />

          {showDerivedInfo && (
            <View sx={{ gap: 16 }}>
              <View
                sx={{
                  backgroundColor: colors.$surfaceSecondary,
                  borderRadius: 12,
                  padding: 16,
                  gap: 12
                }}>
                {derivedAddresses.map((item, index) => (
                  <React.Fragment key={item.address}>
                    <View
                      sx={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8
                      }}>
                      <TokenLogo symbol={item.symbol} />
                      <Text sx={{ color: colors.$textPrimary, fontSize: 16 }}>
                        {truncateAddress(item.address, 8)}
                      </Text>
                    </View>
                    {index < derivedAddresses.length - 1 && (
                      <View
                        sx={{
                          height: 1,
                          backgroundColor: colors.$borderPrimary,
                          marginVertical: 4
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>

              {totalBalanceDisplay && (
                <View
                  sx={{
                    backgroundColor: colors.$surfaceSecondary,
                    borderRadius: 12,
                    padding: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                  <Text
                    sx={{
                      color: colors.$textPrimary,
                      fontSize: 16,
                      fontWeight: 'bold'
                    }}>
                    Total balance
                  </Text>
                  {isAwaitingOurBalance ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text
                      sx={{
                        color: colors.$textPrimary,
                        fontSize: 16,
                        fontWeight: 'bold'
                      }}>
                      {totalBalanceDisplay}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

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
      </View>
    </ScrollScreen>
  )
}

export default ImportPrivateKeyScreen
