import React, { useCallback } from 'react'
import { Linking } from 'react-native'
import { useNavigation } from 'expo-router'
import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import {
  DOCS_KEYSTONE_DEPRECATION_URL,
  KEYSTONE_DEPRECATION_DATE
} from 'resources/Constants'
import Logger from 'utils/Logger'

const KeystoneDeprecationScreen = (): JSX.Element => {
  const navigation = useNavigation()
  const {
    theme: { colors }
  } = useTheme()

  const openArticle = useCallback((): void => {
    Linking.openURL(DOCS_KEYSTONE_DEPRECATION_URL).catch(Logger.error)
  }, [])

  const dismiss = useCallback((): void => {
    navigation.goBack()
  }, [navigation])

  const renderFooter = useCallback(
    (): React.ReactNode => (
      <View sx={{ gap: 20 }}>
        <Button
          testID="keystoneDeprecation_learnMore_btn"
          size="large"
          type="primary"
          onPress={openArticle}>
          Learn more
        </Button>
        <Button
          testID="keystoneDeprecation_dismiss_btn"
          size="large"
          type="tertiary"
          onPress={dismiss}>
          Dismiss
        </Button>
      </View>
    ),
    [openArticle, dismiss]
  )

  return (
    <ScrollScreen
      isModal
      showNavigationHeaderTitle={false}
      renderFooter={renderFooter}
      contentContainerStyle={{
        padding: 16,
        flex: 1
      }}>
      <View sx={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <Icons.Alert.ErrorOutline
          color={colors.$textDanger}
          width={62.5}
          height={62.5}
        />
        <View sx={{ alignItems: 'center', gap: 20, marginTop: 40 }}>
          <Text
            variant="heading3"
            sx={{ textAlign: 'center', color: colors.$textPrimary }}>
            Keystone support has ended
          </Text>
          <Text
            variant="subtitle1"
            sx={{ textAlign: 'center', color: colors.$textSecondary }}>
            {`Core ended support for Keystone wallets on ${KEYSTONE_DEPRECATION_DATE}. You can still see your Keystone accounts and balances, but Keystone transactions can no longer be signed in Core.`}
          </Text>
          <Text
            variant="subtitle1"
            sx={{ textAlign: 'center', color: colors.$textSecondary }}>
            Your funds are safe and your Keystone device still controls them. To
            keep using Core, you will need to move the funds to a wallet type
            that Core supports.
          </Text>
        </View>
      </View>
    </ScrollScreen>
  )
}

export default KeystoneDeprecationScreen
