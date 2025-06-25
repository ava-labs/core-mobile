import { Button, showAlert, View, Text, useTheme } from '@avalabs/k2-alpine'
import * as bip39 from 'bip39'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useState, useEffect, useMemo } from 'react'
import RecoveryPhraseInput from 'new/features/onboarding/components/RecoveryPhraseInput'
import Logger from 'utils/Logger'
import {
  getWalletFromMnemonic,
  DerivationPath
} from '@avalabs/core-wallets-sdk'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { useRouter } from 'expo-router'
import { useImportMnemonic } from 'new/common/hooks/useImportMnemonic'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import KeychainMigrator from 'utils/KeychainMigrator'
import { MINIMUM_MNEMONIC_WORDS } from 'common/consts'
import { useCheckIfAccountExists } from 'features/onboarding/hooks/useIsExistingAccount'

interface DerivedAddressItem {
  address: string
  icon?: React.ReactNode
}

const ImportSeedWallet = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const router = useRouter()
  const [mnemonic, setMnemonic] = useState('')
  const [derivedAddresses, setDerivedAddresses] = useState<
    DerivedAddressItem[]
  >([])
  const [isKnownPhrase, setIsKnownPhrase] = useState(false)
  const { isImporting, importWallet } = useImportMnemonic()
  const [isCheckingMigration, setIsCheckingMigration] = useState(false)
  const activeWallet = useActiveWallet()
  const checkIfAccountExists = useCheckIfAccountExists()
  const errorMessage = useMemo(() => {
    return isKnownPhrase
      ? 'This recovery phrase appears to have already been imported.'
      : undefined
  }, [isKnownPhrase])

  useEffect(() => {
    const trimmedMnemonic = mnemonic.toLowerCase().trim()
    const isValid = bip39.validateMnemonic(trimmedMnemonic)

    if (isValid) {
      try {
        const newAddresses: DerivedAddressItem[] = []
        for (let i = 0; i < 3; i++) {
          const wallet = getWalletFromMnemonic(
            trimmedMnemonic,
            i,
            DerivationPath.BIP44
          )
          newAddresses.push({ address: wallet.address })
        }

        const isMnemonicKnown = checkIfAccountExists(newAddresses[0]?.address)

        if (isMnemonicKnown) {
          setIsKnownPhrase(true)
          return
        }

        setIsKnownPhrase(false)
        setDerivedAddresses(newAddresses)
      } catch (error) {
        Logger.error('Error deriving addresses:', error)
        setIsKnownPhrase(false)
        setDerivedAddresses([])
      }
    } else {
      setIsKnownPhrase(false)
      setDerivedAddresses([])
    }
  }, [mnemonic, checkIfAccountExists])

  const handleImport = useCallback(async () => {
    const trimmedMnemonic = mnemonic.toLowerCase().trim()
    const isValid = bip39.validateMnemonic(trimmedMnemonic)

    if (!isValid) {
      showAlert({
        title: 'Invalid phrase',
        description:
          'The recovery phrase you entered is invalid. Please double check for spelling mistakes or the order of each word.',
        buttons: [
          {
            text: 'Dismiss',
            style: 'destructive'
          }
        ]
      })
      return
    }

    setIsCheckingMigration(true)
    const migrator = new KeychainMigrator(activeWallet.id)
    const migrationNeeded = await migrator.getMigrationStatus('PIN')
    setIsCheckingMigration(false)

    if (migrationNeeded) {
      router.navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/verifyPin',
        params: {
          walletSecretToImport: trimmedMnemonic
        }
      })
    } else {
      await importWallet(trimmedMnemonic)
    }
  }, [mnemonic, router, importWallet, activeWallet.id])

  const renderFooter = useCallback(() => {
    const disabled =
      !mnemonic ||
      mnemonic.trim().split(/\s+/).length < MINIMUM_MNEMONIC_WORDS ||
      isImporting ||
      isCheckingMigration ||
      isKnownPhrase

    return (
      <View
        sx={{
          gap: 12
        }}>
        <Button
          size="large"
          type="primary"
          onPress={handleImport}
          disabled={disabled}>
          Import
        </Button>
      </View>
    )
  }, [handleImport, mnemonic, isImporting, isCheckingMigration, isKnownPhrase])

  return (
    <ScrollScreen
      title={'Enter your\nrecovery phrase'}
      navigationTitle="Enter your recovery phrase"
      subtitle="This phrase should contain 12, 18, or 24 words. Use a space between each word."
      contentContainerStyle={{ padding: 16 }}
      shouldAvoidKeyboard={false}
      renderFooter={renderFooter}>
      <View
        style={{
          paddingTop: 16
        }}>
        <RecoveryPhraseInput onChangeText={setMnemonic} />
        {errorMessage ? (
          <View sx={{ alignItems: 'center' }}>
            <Text variant="caption" sx={{ color: '$textDanger' }}>
              {errorMessage}
            </Text>
          </View>
        ) : undefined}
      </View>
      {derivedAddresses.length > 0 && (
        <View sx={{ marginTop: 24, marginBottom: 16 }}>
          <Text
            variant="heading6"
            sx={{ marginBottom: 8, color: colors.$textPrimary }}>
            Derived Addresses:
          </Text>
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
                  <Text
                    sx={{ color: colors.$textPrimary, fontSize: 16 }}
                    selectable>
                    {truncateAddress(item.address, 10)}
                  </Text>
                </View>
                {index < derivedAddresses.length - 1 && (
                  <View
                    sx={{
                      height: 1,
                      backgroundColor: colors.$borderPrimary
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}
    </ScrollScreen>
  )
}

export default ImportSeedWallet
