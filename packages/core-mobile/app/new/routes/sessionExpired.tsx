import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { BackHandler } from 'react-native'
import {
  Button,
  Icons,
  SafeAreaView,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Space } from 'components/Space'
import { startRefreshSeedlessTokenFlow } from 'common/utils/startRefreshSeedlessTokenFlow'
import SeedlessService from 'seedless/services/SeedlessService'
import { useDispatch, useSelector } from 'react-redux'
import { onLogOut, selectWalletState, WalletState } from 'store/app'
import { initWalletServiceAndUnlock } from 'hooks/useWallet'
import { SEEDLESS_MNEMONIC_STUB } from 'seedless/consts'
import { WalletType } from 'services/wallet/types'
import Logger from 'utils/Logger'

const SessionTimeoutScreen = (): React.JSX.Element => {
  const router = useRouter()
  const walletState = useSelector(selectWalletState)
  const dispatch = useDispatch()
  const {
    theme: { colors }
  } = useTheme()
  useFocusEffect(
    useCallback(() => {
      const onBackPress = (): boolean => true
      BackHandler.addEventListener('hardwareBackPress', onBackPress)

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress)
    }, [])
  )

  const onRetry = useCallback((): void => {
    startRefreshSeedlessTokenFlow(SeedlessService.session)
      .then(result => {
        if (result.success) {
          router.canDismiss() && router.dismiss()
          if (walletState === WalletState.INACTIVE) {
            initWalletServiceAndUnlock({
              dispatch,
              mnemonic: SEEDLESS_MNEMONIC_STUB,
              walletType: WalletType.SEEDLESS,
              isLoggingIn: true
            }).catch(Logger.error)
          }
          return
        }
        switch (result.error.name) {
          case 'USER_ID_MISMATCH':
            showAlert({
              title: 'Wrong email address',
              description:
                'Please log in with the email address you used when you created your wallet.',
              buttons: [
                {
                  text: 'OK',
                  style: 'cancel'
                }
              ]
            })
            break
          case 'USER_CANCELED':
          case 'UNSUPPORTED_OIDC_PROVIDER':
          case 'NOT_REGISTERED':
          case 'UNEXPECTED_ERROR':
            throw new Error(result.error.name)
        }
      })
      .catch(e => {
        Logger.error('startRefreshSeedlessTokenFlow error', e)
        router.canDismiss() && router.dismiss()
        dispatch(onLogOut)
      })
  }, [dispatch, router, walletState])

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'space-between',
        marginHorizontal: 16
      }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Icons.Action.Info color={colors.$textPrimary} width={36} height={36} />
        <Space y={24} />
        <Text variant={'heading5'}>Your session has timed out</Text>
        <Space y={8} />
        <Text variant={'body2'} style={{ textAlign: 'center' }}>
          Tap Retry to continue
        </Text>
      </View>
      <Button
        size={'large'}
        type={'primary'}
        onPress={onRetry}
        style={{ width: '100%', marginBottom: 16 }}>
        Retry
      </Button>
    </SafeAreaView>
  )
}

export default SessionTimeoutScreen
