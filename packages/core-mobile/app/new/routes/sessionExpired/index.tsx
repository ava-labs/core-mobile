import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { BackHandler } from 'react-native'
import { Icons, SafeAreaView, showAlert, useTheme } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { startRefreshSeedlessTokenFlow } from 'common/utils/startRefreshSeedlessTokenFlow'
import SeedlessService from 'seedless/services/SeedlessService'
import { useDispatch } from 'react-redux'
import { onLogOut } from 'store/app'
import Logger from 'utils/Logger'
import { useUserMfa } from 'common/hooks/useUserMfa'
import { useWallet } from 'hooks/useWallet'

const SessionExpiredScreen = (): React.JSX.Element => {
  const { data: mfaMethods } = useUserMfa()
  const { unlock } = useWallet()
  const router = useRouter()
  const dispatch = useDispatch()
  const {
    theme: { colors }
  } = useTheme()
  useFocusEffect(
    useCallback(() => {
      const onBackPress = (): boolean => true
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      )

      return () => backHandler.remove()
    }, [])
  )

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const onRetry = useCallback(async (): Promise<void> => {
    startRefreshSeedlessTokenFlow(SeedlessService.session)
      .then(async result => {
        if (result.success) {
          if (mfaMethods?.length === 0) {
            await unlock()
            router.canGoBack() && router.back()
            return
          }
          if (mfaMethods?.length === 1) {
            const mfa = mfaMethods[0]
            if (mfa?.type === 'totp') {
              router.navigate({
                pathname: '/sessionExpired/verifyTotpCode',
                params: {
                  mfaId: result.value.mfaId,
                  oidcToken: result.value.oidcToken
                }
              })
              return
            } else {
              await SeedlessService.session.approveFido(
                result.value.oidcToken,
                result.value.mfaId,
                true
              )
              await unlock()
              router.canGoBack() && router.back()
              return
            }
          }
          router.navigate({
            pathname: '/sessionExpired/selectMfaMethod',
            params: {
              mfaId: result.value.mfaId,
              oidcToken: result.value.oidcToken
            }
          })
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
                  text: 'Got it'
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
        dispatch(onLogOut())
      })
  }, [dispatch, unlock, mfaMethods, router])

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <ErrorState
        icon={
          <Icons.Action.Info
            color={colors.$textPrimary}
            width={56}
            height={56}
          />
        }
        title="Your session has timed out"
        description="Tap Retry to continue"
        button={{
          title: 'Retry',
          onPress: () => {
            onRetry()
          }
        }}
      />
    </SafeAreaView>
  )
}

export default SessionExpiredScreen
