import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setViewOnce, ViewOnceKey } from 'store/viewOnce'

import { Image } from 'expo-image'
import { withNavigationEvents } from 'common/utils/navigateWithPromise'
import Glow from '../../../../assets/glow-solana.png'

function SolanaLaunchScreen(): JSX.Element {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()

  const handleDismiss = useCallback(() => {
    router.canDismiss() && router.dismissAll()
  }, [router])

  const renderFooter = useCallback(() => {
    return (
      <Button type="primary" size="large" onPress={handleDismiss}>
        Got it
      </Button>
    )
  }, [handleDismiss])

  // Set view once flag when user dismisses the modal by gesture or button
  useEffect(() => {
    return () => {
      dispatch(setViewOnce(ViewOnceKey.SOLANA_LAUNCH))
    }
  }, [dispatch])

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      isModal
      contentContainerStyle={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 50
      }}>
      <Image
        source={Glow}
        style={{ width: 360, height: 360, marginVertical: -120 }}
      />
      <View
        style={{
          gap: 13
        }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: '#F7B500',
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <Text
              variant="buttonMedium"
              style={{
                color: theme.colors.$black,
                fontSize: 12,
                fontFamily: 'Inter-Bold'
              }}>
              NEW
            </Text>
          </View>
        </View>
        <View style={{ gap: 10, paddingHorizontal: 32 }}>
          <Text
            testID="solana_launch_title"
            variant="heading3"
            style={{ textAlign: 'center' }}>
            {`Trade on Solana\ndirectly from Core`}
          </Text>
          <Text variant="subtitle1" style={{ textAlign: 'center' }}>
            Explore and transact easily on the Solana ecosystem using all the
            best of Core
          </Text>
        </View>
      </View>
    </ScrollScreen>
  )
}

export default withNavigationEvents(SolanaLaunchScreen)
