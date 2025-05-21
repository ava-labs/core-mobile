import {
  alpha,
  Icons,
  SCREEN_WIDTH,
  ScrollView,
  Text,
  TextInput,
  Tooltip,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  KeyboardStickyView,
  useKeyboardState
} from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import ScreenHeader from 'common/components/ScreenHeader'

const SCANNER_WIDTH = SCREEN_WIDTH - 32

export const WalletConnectScanScreen = (): React.JSX.Element => {
  const { theme } = useTheme()
  const keyboard = useKeyboardState()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { setPendingDeepLink } = useDeeplink()
  const [wcLink, setWcLink] = useState('')

  const handleOnChangeText = useCallback(
    (value: string) => {
      setWcLink(value)
      setPendingDeepLink({
        url: value,
        origin: DeepLinkOrigin.ORIGIN_QR_CODE
      })
      router.canGoBack() && router.back()
    },
    [router, setPendingDeepLink]
  )

  const renderFooter = useCallback((): JSX.Element => {
    return (
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          borderRadius: 12,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}>
        <View sx={{ width: '100%', paddingTop: 12 }}>
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start'
            }}>
            <Text
              variant="body2"
              sx={{
                paddingLeft: 16,
                paddingRight: 10,
                fontSize: 11,
                lineHeight: 14,
                color: '$textSecondary'
              }}>
              Connection URI
            </Text>
            <Tooltip
              title="Connection URI"
              description="Use this to manually connect"
            />
          </View>
          <TextInput
            onChangeText={handleOnChangeText}
            numberOfLines={1}
            value={wcLink}
            placeholder="example: wc:f0b7866e57d6be052782a..."
            textInputSx={{
              color: '$textPrimary',
              fontSize: 15,
              lineHeight: 20
            }}
          />
        </View>
      </View>
    )
  }, [handleOnChangeText, wcLink])

  const blackLinearGradientColors: [string, string, ...string[]] = useMemo(
    () => [alpha(theme.colors.$black, 0), alpha(theme.colors.$black, 0.7)],
    [theme.colors.$black]
  )

  const renderScanner = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center'
        }}>
        <QrCodeScanner
          onSuccess={handleOnChangeText}
          vibrate={true}
          sx={{
            flex: 1,
            width: SCANNER_WIDTH
          }}
        />
        <LinearGradient
          pointerEvents="none"
          colors={blackLinearGradientColors}
          style={{
            position: 'absolute',
            bottom: -0.5,
            left: 0,
            right: 0,
            height: 60,
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            marginHorizontal: 16
          }}
        />
        <View
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            marginHorizontal: 16,
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Icons.Custom.Connect color={theme.colors.$white} />
          <Text
            variant="subtitle1"
            sx={{
              textAlign: 'center',
              color: '$white',
              fontWeight: '500',
              marginLeft: 8
            }}>
            WalletConnect QR Code
          </Text>
        </View>
      </View>
    )
  }, [handleOnChangeText, blackLinearGradientColors, theme.colors.$white])

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        scrollEnabled={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flex: 1,
          marginTop: 30,
          marginBottom: insets.bottom + 12
        }}>
        <ScreenHeader
          title={'Connect'}
          titleSx={{ marginLeft: 16, marginTop: 24 }}
        />
        {renderScanner()}
      </ScrollView>
      <KeyboardStickyView
        enabled={true}
        offset={{
          opened: 0,
          closed: -insets.bottom
        }}>
        <LinearGradientBottomWrapper enabled={keyboard?.isVisible}>
          <View
            style={{
              padding: 16,
              paddingTop: 0
            }}>
            {renderFooter()}
          </View>
        </LinearGradientBottomWrapper>
      </KeyboardStickyView>
    </View>
  )
}
