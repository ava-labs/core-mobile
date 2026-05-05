import {
  ActivityIndicator,
  Button,
  GroupList,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useCallback, useMemo, useState } from 'react'
import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'
import { resetViewOnce, setViewOnce, ViewOnceKey } from 'store/viewOnce'
import { ScrollScreen } from './ScrollScreen'

export const TransactionOnboarding = ({
  icon,
  title,
  subtitle,
  buttonTitle,
  viewOnceKey,
  onPressNext,
  footerAccessory,
  scrollEnabled,
  isLoading
}: {
  icon: {
    component: React.FC<SvgProps>
    size?: number
  }
  title: string
  subtitle: string
  buttonTitle?: string
  viewOnceKey?: ViewOnceKey
  onPressNext: () => void
  footerAccessory?: JSX.Element
  scrollEnabled?: boolean
  isLoading?: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const [hide, setHide] = useState(true)

  const handlePressNext = useCallback(() => {
    if (viewOnceKey) {
      if (hide) {
        dispatch(setViewOnce(viewOnceKey))
      } else {
        dispatch(resetViewOnce(viewOnceKey))
      }
    }
    onPressNext()
  }, [dispatch, hide, onPressNext, viewOnceKey])

  const groupListData = useMemo(() => {
    return [
      {
        title: 'Hide this screen next time',
        accessory: <Toggle value={hide} onValueChange={setHide} />
      }
    ]
  }, [hide, setHide])

  // Hello UI: sheet primary CTAs render as dark-filled pills (Vellum 10
  // on light, Vellum 94 on dark). $primary in Moto is Whale-50 blue —
  // appropriate for inline accents but too noisy for a modal's main
  // action, so we override to inverse-surface tones in Moto.
  const isMoto = theme.variant === 'moto'
  const motoButtonStyle = isMoto
    ? { backgroundColor: theme.colors.$inverseSurface }
    : undefined
  const motoTextStyle = isMoto
    ? { color: theme.colors.$inverseOnSurface }
    : undefined

  const renderHidePill = useCallback(() => {
    if (!viewOnceKey) return null
    if (isMoto) {
      // Hello UI: single rounded pill with label left + toggle right.
      return (
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 18,
            height: 48,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <Text
            variant="body2"
            sx={{
              fontFamily: 'Rookery-Medium',
              fontSize: 14,
              lineHeight: 16,
              color: '$textPrimary'
            }}>
            Hide this screen next time
          </Text>
          <Toggle value={hide} onValueChange={setHide} />
        </View>
      )
    }
    return (
      <GroupList
        data={groupListData}
        titleSx={{ fontFamily: 'Inter-Regular', fontSize: 15 }}
        textContainerSx={{
          paddingVertical: 4
        }}
      />
    )
  }, [viewOnceKey, isMoto, hide, groupListData])

  const renderFooter = useCallback(() => {
    return (
      <View sx={{ gap: 20 }}>
        {footerAccessory}
        {renderHidePill()}
        <Button
          type="primary"
          size="large"
          style={motoButtonStyle}
          textStyle={motoTextStyle}
          disabled={isLoading}
          onPress={handlePressNext}
          testID={isLoading ? undefined : 'transaction_onboarding__next'}>
          {isLoading ? <ActivityIndicator /> : buttonTitle ?? "Let's go!"}
        </Button>
      </View>
    )
  }, [
    renderHidePill,
    handlePressNext,
    buttonTitle,
    footerAccessory,
    isLoading,
    motoButtonStyle,
    motoTextStyle
  ])

  return (
    <ScrollScreen
      isModal
      scrollEnabled={scrollEnabled}
      renderFooter={renderFooter}
      contentContainerStyle={{
        padding: 16
      }}>
      <View sx={{ marginTop: 50, alignItems: 'center' }}>
        {isMoto ? (
          /* Hello UI: 75dp Vellum-96 rounded-20 squircle tile with the
             icon centered inside at ~40dp. */
          <View
            sx={{
              width: 75,
              height: 75,
              borderRadius: 20,
              backgroundColor: '$surfaceSecondary',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            {typeof icon.component === 'function' &&
              (icon.component({
                width: 40,
                height: 40,
                color: theme.colors.$textPrimary
              }) as React.ReactNode)}
          </View>
        ) : (
          typeof icon.component === 'function' &&
          (icon.component({
            width: icon.size ?? ICON_DEFAULT_SIZE,
            height: icon.size ?? ICON_DEFAULT_SIZE,
            color: theme.colors.$textPrimary
          }) as React.ReactNode)
        )}
        <Text
          variant="heading3"
          sx={{
            textAlign: 'center',
            marginTop: 24,
            lineHeight: 30,
            maxWidth: 300
          }}>
          {title}
        </Text>
        <Text
          variant="subtitle1"
          sx={{ textAlign: 'center', marginTop: 14, maxWidth: 320 }}>
          {subtitle}
        </Text>
      </View>
    </ScrollScreen>
  )
}

const ICON_DEFAULT_SIZE = 75
