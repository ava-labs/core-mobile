import { Button, showAlert, View, Text, useTheme } from '@avalabs/k2-alpine'
import * as bip39 from 'bip39'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useState, useEffect } from 'react'
import RecoveryPhraseInput from 'new/features/onboarding/components/RecoveryPhraseInput'
import Logger from 'utils/Logger'
import {
  getWalletFromMnemonic,
  DerivationPath
} from '@avalabs/core-wallets-sdk'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { useRouter } from 'expo-router'

const MINIMUM_MNEMONIC_WORDS = 12

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
        setDerivedAddresses(newAddresses)
      } catch (error) {
        Logger.error('Error deriving addresses:', error)
        setDerivedAddresses([])
      }
    } else {
      setDerivedAddresses([])
    }
  }, [mnemonic])

  const handleImport = useCallback(() => {
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

    router.navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/verifyPin',
      params: {
        walletSecretToImport: mnemonic
      }
    })
  }, [mnemonic, router])

  const renderFooter = useCallback(() => {
    return (
      <View
        sx={{
          gap: 12
        }}>
        <Button
          size="large"
          type="primary"
          onPress={handleImport}
          disabled={
            !mnemonic ||
            mnemonic.trim().split(/\s+/).length < MINIMUM_MNEMONIC_WORDS
          }>
          Import
        </Button>
      </View>
    )
  }, [handleImport, mnemonic])

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
