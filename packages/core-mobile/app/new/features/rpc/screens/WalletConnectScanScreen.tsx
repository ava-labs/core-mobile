import {
  alpha,
  SCREEN_WIDTH,
  ScrollView,
  Text,
  TextInput,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Platform, View as RNView } from 'react-native'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { useRouter } from 'expo-router'
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  KeyboardStickyView,
  useKeyboardState
} from 'react-native-keyboard-controller'
import { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'

const SCANNER_WIDTH = SCREEN_WIDTH - 32

export const WalletConnectScanScreen = (): React.JSX.Element => {
  const { theme } = useTheme()
  const keyboard = useKeyboardState()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { setPendingDeepLink } = useDeeplink()
  const [wcLink, setWcLink] = useState('')
  const footerRef = useRef<RNView>(null)
  const footerHeight = useSharedValue<number>(0)

  useLayoutEffect(() => {
    if (footerRef.current) {
      // eslint-disable-next-line max-params
      footerRef.current.measure((x, y, width, height) => {
        footerHeight.value = height
      })
    }
  }, [footerHeight])

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
        <View sx={{ width: '100%' }}>
          <Text
            variant="body2"
            sx={{
              paddingHorizontal: 16,
              paddingTop: 16,
              fontSize: 11,
              lineHeight: 14,
              color: '$textSecondary'
            }}>
            Connection URI
          </Text>
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
          marginTop: 30,
          marginBottom: footerHeight.value - (Platform.OS === 'ios' ? 40 : 50),
          alignItems: 'center'
        }}>
        <QrCodeScanner
          onSuccess={handleOnChangeText}
          vibrate={true}
          sx={{
            height: '100%',
            width: SCANNER_WIDTH
          }}
        />
        <LinearGradient
          pointerEvents="none"
          colors={blackLinearGradientColors}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            marginHorizontal: 16
          }}
        />
        <Text
          variant="subtitle1"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            marginHorizontal: 16,
            textAlign: 'center',
            color: '$white',
            fontWeight: '500',
            marginBottom: 12
          }}>
          WalletConnect QR Code
        </Text>
      </View>
    )
  }, [handleOnChangeText, footerHeight.value, blackLinearGradientColors])

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        scrollEnabled={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
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
            ref={footerRef}
            style={{
              backgroundColor: 'red',
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
