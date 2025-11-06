import { GroupList, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsLedgerSupportBlocked } from 'store/posthog'

const ITEM_HEIGHT = 70

const ImportWalletScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const isLedgerSupportBlocked = useSelector(selectIsLedgerSupportBlocked)

  const data = useMemo(() => {
    const handleTypeRecoveryPhrase = (): void => {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/accountSettings/importSeedWallet' })
    }

    const handleImportPrivateKey = (): void => {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/accountSettings/importPrivateKey' })
    }

    const handleImportLedger = (): void => {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/accountSettings/ledger/pathSelection' })
    }

    const baseData = [
      {
        title: 'Type in a recovery phrase',
        subtitle: (
          <Text
            testID="import_recovery_phrase_btn"
            variant="caption"
            sx={{ fontSize: 12, paddingTop: 4 }}>
            Access with your recovery phrase
          </Text>
        ),
        leftIcon: (
          <Icons.Device.Encrypted
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        ),
        accessory: (
          <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
        ),
        onPress: handleTypeRecoveryPhrase
      },
      {
        title: 'Import a private key',
        subtitle: (
          <Text
            testID="import_private_key_btn"
            variant="caption"
            sx={{ fontSize: 12, paddingTop: 4 }}>
            Access with an existing private key
          </Text>
        ),
        leftIcon: (
          <Icons.Custom.Download
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        ),
        accessory: (
          <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
        ),
        onPress: handleImportPrivateKey
      }
    ]

    if (!isLedgerSupportBlocked) {
      baseData.push({
        title: 'Import from Ledger',
        subtitle: (
          <Text variant="caption" sx={{ fontSize: 12, paddingTop: 4 }}>
            Access with an existing Ledger
          </Text>
        ),
        leftIcon: (
          <Icons.Custom.Ledger
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        ),
        accessory: (
          <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
        ),
        onPress: handleImportLedger
      })
    }

    return baseData
  }, [navigate, colors, isLedgerSupportBlocked])

  return (
    <ScrollScreen
      title={`Add or connect\na wallet`}
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View
        style={{
          marginTop: 24
        }}>
        <GroupList itemHeight={ITEM_HEIGHT} data={data} />
      </View>
    </ScrollScreen>
  )
}
export default ImportWalletScreen
