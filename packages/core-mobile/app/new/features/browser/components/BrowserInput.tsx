import {
  alpha,
  Icons,
  Pressable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import { BlurView } from 'expo-blur'
import AppNavigation from 'navigation/AppNavigation'
import React, { ReactNode, useMemo, useRef, useState } from 'react'
import {
  NativeSyntheticEvent,
  Platform,
  TextInput,
  TextInputFocusEventData,
  TextInputProps
} from 'react-native'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Tab } from 'store/browser'
import { selectIsFavorited } from 'store/browser/slices/favorites'
import { selectAllTabs } from 'store/browser/slices/tabs'
import Logger from 'utils/Logger'
import { BrowserScreenProps } from 'navigation/types'
import {
  HORIZONTAL_MARGIN,
  isValidHttpUrl,
  normalizeUrlWithHttps
} from '../consts'
import { MoreMenu } from '../components/MoreMenu'
import { TabIcon } from '../components/TabIcon'

type TabViewNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

interface BrowserInputProps extends TextInputProps {
  activeTab?: Tab
}

export const BrowserInput = ({
  activeTab,
  onFocus,
  onBlur,
  ...props
}: BrowserInputProps): ReactNode => {
  const { theme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const { navigate } = useNavigation<TabViewNavigationProp>()

  const totalTabs = useSelector(selectAllTabs).length
  const isFavorited = useSelector(
    selectIsFavorited(activeTab?.activeHistory?.id)
  )

  const inputRef = useRef<TextInput>(null)

  const onFocusEvent = (
    event: NativeSyntheticEvent<TextInputFocusEventData>
  ): void => {
    setIsFocused(true)
    onFocus?.(event)
  }

  const onBlurEvent = (
    event: NativeSyntheticEvent<TextInputFocusEventData>
  ): void => {
    setIsFocused(false)
    onBlur?.(event)
  }

  const onClear = (): void => {
    inputRef.current?.clear()
    props.onChangeText?.('')
  }

  const navigateToTabList = (): void => {
    AnalyticsService.capture('BrowserTabsOpened').catch(Logger.error)
    navigate(AppNavigation.Modal.BrowserTabsList)
  }

  const parsedUrl = useMemo(() => {
    try {
      if (props?.value?.length && isValidHttpUrl(props.value)) {
        const urlObj = new URL(normalizeUrlWithHttps(props.value))
        return {
          protocol: urlObj.protocol.replace(':', ''),
          domain: urlObj.hostname,
          path: urlObj.pathname + urlObj.search + urlObj.hash
        }
      }
    } catch (error) {
      return null
    }
  }, [props.value])

  return (
    <BlurView
      style={{
        height: 40,
        borderRadius: 100,
        overflow: 'hidden',
        marginVertical: 12
      }}>
      <TextInput
        ref={inputRef}
        {...props}
        onFocus={onFocusEvent}
        onBlur={onBlurEvent}
        placeholderTextColor={alpha(theme.colors.$textPrimary, 0.5)}
        keyboardType={Platform.OS === 'ios' ? 'web-search' : 'url'}
        autoCorrect={false}
        style={{
          flex: 1,
          color: isFocused ? theme.colors.$textPrimary : 'transparent',
          paddingHorizontal: HORIZONTAL_MARGIN,
          fontSize: 16,
          fontFamily: 'Inter-Regular',
          paddingRight: 24 + HORIZONTAL_MARGIN
        }}
      />

      <Pressable
        pointerEvents={isFocused ? 'auto' : 'none'}
        onPress={onClear}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          top: 0,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: isFocused && props?.value?.length ? 1 : 0,
          paddingRight: 12
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
          backgroundColor: theme.colors.$surfacePrimary,
          borderRadius: 100
        }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isFocused ? 'transparent' : alpha('#999999', 0.2),
            borderRadius: 100,
            gap: 12
          }}>
          <Pressable
            onPress={navigateToTabList}
            style={{
              height: '100%',
              paddingHorizontal: 12,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <TabIcon numberOfTabs={totalTabs} onPress={navigateToTabList} />
          </Pressable>

          <Pressable
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={() => {
              inputRef.current?.focus()
            }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'Inter-Medium',
                fontSize: 14
              }}>
              {props?.value?.length && isValidHttpUrl(props.value) ? (
                <>
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
                </>
              ) : props?.value?.length ? (
                props.value
              ) : (
                'Search or type URL'
              )}
            </Text>
          </Pressable>

          <MoreMenu isFavorited={isFavorited}>
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
              <Icons.Navigation.MoreHoriz width={24} height={24} />
            </Pressable>
          </MoreMenu>
        </View>
      </View>
    </BlurView>
  )
}
