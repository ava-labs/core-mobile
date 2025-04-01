import {
  alpha,
  Icons,
  Pressable,
  ProgressBar,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import { BlurView } from 'expo-blur'
import React, { ReactNode, useMemo } from 'react'
import {
  Platform,
  TextInput,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData
} from 'react-native'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveTab } from 'store/browser'
import { selectIsFavorited } from 'store/browser/slices/favorites'
import Logger from 'utils/Logger'
import { useBrowserContext } from '../BrowserContext'
import {
  HORIZONTAL_MARGIN,
  isValidHttpUrl,
  normalizeUrlWithHttps
} from '../consts'
import { BrowserInputMenu } from './BrowserInputMenu'

export const BrowserInput = ({
  isFocused,
  setIsFocused
}: {
  isFocused: boolean
  setIsFocused: (visible: boolean) => void
}): ReactNode => {
  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const activeTab = useSelector(selectActiveTab)
  const { urlEntry, progress, inputRef, handleUrlSubmit, setUrlEntry } =
    useBrowserContext()

  const isFavorited = useSelector(
    selectIsFavorited(activeTab?.activeHistory?.id)
  )

  const onChangeText = (text: string): void => {
    setUrlEntry(text)
  }

  const onClearInput = (): void => {
    inputRef?.current?.clear()
    setUrlEntry('')
  }

  const navigateToTabList = (): void => {
    AnalyticsService.capture('BrowserTabsOpened').catch(Logger.error)
    navigate('tabs')
  }

  const parsedUrl = useMemo(() => {
    try {
      if (urlEntry.length && isValidHttpUrl(urlEntry)) {
        const urlObj = new URL(normalizeUrlWithHttps(urlEntry))
        return {
          protocol: urlObj.protocol.replace(':', ''),
          domain: urlObj.hostname,
          path: urlObj.pathname + urlObj.search + urlObj.hash
        }
      }
    } catch (error) {
      return null
    }
  }, [urlEntry])

  const onSubmit = (
    event: NativeSyntheticEvent<TextInputSubmitEditingEventData>
  ): void => {
    handleUrlSubmit?.(event.nativeEvent.text)
  }

  return (
    <View
      style={{
        borderRadius: 100,
        boxShadow: isFocused
          ? [
              {
                offsetX: 0,
                offsetY: 5,
                blurRadius: 15,
                spreadDistance: 0,
                color: alpha(theme.colors.$black, 0.15),
                inset: false
              }
            ]
          : undefined
      }}>
      <BlurView
        style={{
          height: 40,
          borderRadius: 100,
          overflow: 'hidden'
        }}>
        <TextInput
          ref={inputRef}
          placeholder="Search or type URL"
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSubmit}
          placeholderTextColor={alpha(theme.colors.$textPrimary, 0.5)}
          keyboardType={Platform.OS === 'ios' ? 'web-search' : 'url'}
          autoCorrect={false}
          autoCapitalize="none"
          style={{
            flex: 1,
            color: isFocused ? theme.colors.$textPrimary : 'transparent',
            paddingHorizontal: HORIZONTAL_MARGIN,
            fontSize: 16,
            fontFamily: 'Inter-Regular',
            paddingRight: 24 + HORIZONTAL_MARGIN,
            opacity: isFocused ? 1 : 0,
            backgroundColor: isFocused
              ? theme.colors.$surfacePrimary
              : 'transparent'
          }}
        />

        <Pressable
          pointerEvents={isFocused ? 'auto' : 'none'}
          onPress={onClearInput}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            top: 0,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: isFocused && urlEntry?.length ? 1 : 0,
            paddingRight: 12,
            zIndex: 10
          }}>
          <Icons.Action.Clear color={theme.colors.$textSecondary} />
        </Pressable>

        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: isFocused ? 0 : 1,
            borderRadius: 100
          }}>
          {/* <MaskedProgressBar progress={progress}> */}
          <ProgressBar progress={progress}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: theme.isDark
                  ? alpha(theme.colors.$white, 0.1)
                  : alpha(theme.colors.$black, 0.2),
                borderRadius: 100
              }}>
              <Pressable
                onPress={navigateToTabList}
                style={{
                  height: '100%',
                  paddingHorizontal: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <Icons.Navigation.Tabs color={theme.colors.$textPrimary} />
              </Pressable>

              <Pressable
                style={{
                  flex: 1,
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 12
                }}
                onPress={() => {
                  inputRef?.current?.focus()
                }}>
                {urlEntry?.length && isValidHttpUrl(urlEntry) ? (
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
                      {parsedUrl?.protocol?.length
                        ? `${parsedUrl.protocol}://`
                        : ''}
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
                    numberOfLines={1}
                    style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 14,
                      color: theme.colors.$textSecondary
                    }}>
                    Search or type URL
                  </Text>
                )}
              </Pressable>

              <BrowserInputMenu isFavorited={isFavorited}>
                <Pressable
                  style={{
                    height: '100%',
                    paddingHorizontal: 12,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onPress={() =>
                    AnalyticsService.capture('BrowserContextualMenuOpened')
                  }>
                  <Icons.Navigation.MoreHoriz
                    color={theme.colors.$textPrimary}
                  />
                </Pressable>
              </BrowserInputMenu>
            </View>
          </ProgressBar>
          {/* </MaskedProgressBar> */}
        </View>
      </BlurView>
    </View>
  )
}
