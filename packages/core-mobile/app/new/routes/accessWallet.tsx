import { GroupList, Icons, useTheme, View } from '@avalabs/k2-alpine'
import Encrypted from 'assets/icons/encrypted.svg'
import Keystone from 'assets/icons/keystone.svg'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsKeystoneBlocked } from 'store/posthog'

const AccessWalletScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()
  const isKeystoneBlocked = useSelector(selectIsKeystoneBlocked)

  const handleEnterRecoveryPhrase = useCallback((): void => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/mnemonic/',
      params: { recovering: 'true' }
    })
  }, [navigate])

  const handleEnterKeystone = useCallback((): void => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/keystone/termsAndConditions/'
    })
  }, [navigate])

  const handleCreateMnemonicWallet = useCallback((): void => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/onboarding/mnemonic/'
    })
  }, [navigate])

  const data = useMemo(() => {
    const res = []
    res.push({
      title: 'Type in a recovery phrase',
      leftIcon: <Encrypted color={theme.colors.$textPrimary} />,
      onPress: handleEnterRecoveryPhrase
    })
    if (!isKeystoneBlocked) {
      res.push({
        title: 'Add using Keystone',
        leftIcon: <Keystone color={theme.colors.$textPrimary} />,
        onPress: handleEnterKeystone
      })
    }
    res.push({
      title: 'Create a new wallet',
      leftIcon: <Icons.Content.Add color={theme.colors.$textPrimary} />,
      onPress: handleCreateMnemonicWallet
    })
    return res
  }, [
    handleCreateMnemonicWallet,
    handleEnterKeystone,
    handleEnterRecoveryPhrase,
    isKeystoneBlocked,
    theme.colors
  ])

  return (
    <ScrollScreen
      title="How would you like to access your existing wallet?"
      contentContainerStyle={{ padding: 16 }}>
      <View
        style={{
          marginTop: 24
        }}>
        <GroupList data={data} itemHeight={60} />
      </View>
    </ScrollScreen>
  )
}

export default AccessWalletScreen
