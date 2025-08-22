import {
  alpha,
  ANIMATED,
  Icons,
  MaskedProgressBar,
  Pressable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import React, { ReactNode, useCallback, useMemo } from 'react'
import {
  NativeSyntheticEvent,
  Platform,
  TextInput,
  TextInputSubmitEditingEventData
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveTab } from 'store/browser'
import { selectIsFavorited } from 'store/browser/slices/favorites'
import Logger from 'utils/Logger'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import { isValidHttpUrl, normalizeUrlWithHttps } from '../utils'
import { BrowserInputMenu } from './BrowserInputMenu'

const INPUT_HEIGHT = 40

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

export const BrowserInput = (): ReactNode => {
  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const activeTab = useSelector(selectActiveTab)
  const {
    urlEntry,
    progress,
    inputRef,
    handleUrlSubmit,
    setUrlEntry,
    showRecentSearches,
    isRenameFavoriteVisible,
    isFocused
  } = useBrowserContext()

  const isFavorited = useSelector(
    selectIsFavorited(activeTab?.activeHistory?.id)
  )

  const parsedUrl = useMemo(() => {
    try {
      if (
        activeTab?.activeHistory?.url.length &&
        isValidHttpUrl(activeTab?.activeHistory?.url)
      ) {
        const urlObj = new URL(
          normalizeUrlWithHttps(activeTab?.activeHistory?.url)
        )
        return {
          protocol: urlObj.protocol.replace(':', ''),
          domain: urlObj.hostname,
          path: urlObj.pathname + urlObj.search + urlObj.hash
        }
      }
    } catch (error) {
      return null
    }
  }, [activeTab?.activeHistory?.url])

  const onChangeText = (text: string): void => {
    setUrlEntry(text)
  }

  const onSubmit = (
    event: NativeSyntheticEvent<TextInputSubmitEditingEventData>
  ): void => {
    AnalyticsService.capture('BrowserSearchSubmitted').catch(Logger.error)

    setUrlEntry(event.nativeEvent.text)
    handleUrlSubmit?.(event.nativeEvent.text)
  }

  const onClear = (): void => {
    showRecentSearches.value = false
    setUrlEntry('')
  }

  const onFocus = (): void => {
    isFocused.value = true
  }

  const onBlur = (): void => {
    isFocused.value = false
  }

  const navigateToTabs = useCallback((): void => {
    AnalyticsService.capture('BrowserTabsOpened').catch(Logger.error)
    // @ts-ignore TODO: make routes typesafe
    navigate('(modals)/browserTabs')
  }, [navigate])

  const renderPlaceholder = useCallback((): ReactNode => {
    return (
      <Pressable
        style={{
          flex: 1,
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onPress={() => {
          inputRef?.current?.focus()
        }}>
        {activeTab?.activeHistory?.url.length &&
        isValidHttpUrl(activeTab?.activeHistory?.url) ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Inter-Medium',
              fontSize: 14
            }}>
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontSize: 14,
                opacity: 0.6
              }}>
              {parsedUrl?.protocol?.length ? `${parsedUrl.protocol}://` : ''}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter-Medium',
                fontSize: 14
              }}>
              {parsedUrl?.domain}
            </Text>
            <Text
              style={{
                opacity: 0.6,
                fontFamily: 'Inter-Medium',
                fontSize: 14
              }}>
              {parsedUrl?.path}
            </Text>
          </Text>
        ) : urlEntry?.length ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'Inter-Medium',
              fontSize: 14
            }}>
            {urlEntry}
          </Text>
        ) : (
          <Text
            style={{
              fontFamily: 'Inter-Medium',
              fontSize: 14,
              color: theme.colors.$textSecondary
            }}>
            Search or type URL
          </Text>
        )}
      </Pressable>
    )
  }, [
    activeTab?.activeHistory?.url,
    inputRef,
    parsedUrl?.domain,
    parsedUrl?.path,
    parsedUrl?.protocol,
    theme.colors.$textSecondary,
    urlEntry
  ])

  const wrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        isFocused.value || isRenameFavoriteVisible.value ? 1 : 0,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  const contentStyle = useAnimatedStyle(() => {
    return {
      zIndex: isFocused.value || isRenameFavoriteVisible.value ? 0 : 10,
      opacity: withTiming(
        isFocused.value || isRenameFavoriteVisible.value ? 0 : 1,
        ANIMATED.TIMING_CONFIG
      ),
      pointerEvents: isFocused.value ? 'none' : 'auto'
    }
  })

  const inputStyle = useAnimatedStyle(() => {
    return {
      zIndex: isFocused.value || isRenameFavoriteVisible.value ? 10 : 0,
      opacity: withTiming(
        isFocused.value || isRenameFavoriteVisible.value ? 1 : 0,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  const animatedInputStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      isFocused.value ? 0 : 1,
      [0, 1],
      [theme.colors.$textPrimary, 'transparent']
    )
    return {
      color
    }
  })

  const onClearGesture = Gesture.Tap()
    .onEnd(() => {
      onClear()
    })
    .runOnJS(true)

  return (
    <Animated.View
      style={{
        borderRadius: 100
      }}>
      <Animated.View
        style={[
          wrapperStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 100,
            boxShadow: [
              {
                offsetX: 0,
                offsetY: 5,
                blurRadius: 15,
                spreadDistance: 0,
                color: alpha(theme.colors.$black, 0.25),
                inset: false
              }
            ]
          }
        ]}
      />

      <View
        style={{
          height: INPUT_HEIGHT,
          borderRadius: 100,
          overflow: 'hidden'
        }}>
        <Animated.View
          style={[
            inputStyle,
            {
              flex: 1,
              flexDirection: 'row',
              backgroundColor: theme.isDark ? '#555557' : theme.colors.$white
            }
          ]}>
          <AnimatedTextInput
            testID="search_bar"
            ref={inputRef}
            value={urlEntry}
            placeholder="Search or type URL"
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            onSubmitEditing={onSubmit}
            placeholderTextColor={alpha(theme.colors.$textPrimary, 0.5)}
            keyboardType={Platform.OS === 'ios' ? 'web-search' : 'url'}
            autoCorrect={false}
            allowFontScaling={false}
            autoCapitalize="none"
            style={[
              animatedInputStyle,
              {
                flex: 1,
                paddingHorizontal: HORIZONTAL_MARGIN,
                fontSize: 16,
                paddingVertical: 0,
                fontFamily: 'Inter-Regular',
                paddingRight: HORIZONTAL_MARGIN / 2
              }
            ]}
          />
          {urlEntry?.length > 0 && (
            <GestureDetector gesture={onClearGesture}>
              <View
                style={{
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: 1,
                  paddingHorizontal: 12
                }}>
                <Icons.Action.Clear color={theme.colors.$textSecondary} />
              </View>
            </GestureDetector>
          )}
        </Animated.View>

        <Animated.View
          style={[
            contentStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 100
            }
          ]}>
          <MaskedProgressBar progress={progress}>
            <View
              style={{
                height: '100%',
                flexDirection: 'row',
                backgroundColor: theme.isDark
                  ? alpha(theme.colors.$white, 0.1)
                  : alpha(theme.colors.$black, 0.15),
                borderRadius: 100
              }}>
              <Pressable
                onPress={navigateToTabs}
                style={{
                  height: '100%',
                  paddingHorizontal: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <Icons.Navigation.Tabs color={theme.colors.$textPrimary} />
              </Pressable>

              {renderPlaceholder()}

              <BrowserInputMenu isFavorited={isFavorited} />
            </View>
          </MaskedProgressBar>
        </Animated.View>
      </View>
    </Animated.View>
  )
}
