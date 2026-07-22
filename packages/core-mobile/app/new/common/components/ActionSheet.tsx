import { SxProp, View } from '@avalabs/k2-alpine'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { BackHandler } from 'react-native'
import { useNavigation } from 'expo-router'
import {
  ActionButtons,
  ActionButtonsProps
} from 'new/features/approval/components/ActionButtons'
import { ScrollScreen } from './ScrollScreen'

/**
 * A customizable bottom sheet component (used with expo-router/react-navigation modal) that includes:
 * - A scrollable content area.
 * - A sticky footer with two action buttons (confirm and cancel).
 * - A fading header that displays a grabber and dynamically shows the title as content is scrolled.
 *
 * Ideal for approval flows or modal interactions that require user decisions.
 */
export const ActionSheet = ({
  title,
  navigationTitle,
  onClose,
  confirm,
  cancel,
  children,
  alert,
  sx,
  isModal,
  shouldAvoidKeyboard,
  renderFooterOverride,
  requireScrollToConfirm,
  headerCenterOverlay,
  renderHeaderLeft,
  showNavigationHeaderTitle,
  centerContent
}: {
  title?: string
  navigationTitle?: string
  onClose: () => void
  children: React.ReactNode
  sx?: SxProp
  isModal?: boolean
  shouldAvoidKeyboard?: boolean
  renderFooterOverride?: () => JSX.Element | null
  requireScrollToConfirm?: boolean
  /** Overlay rendered absolutely over the header area (e.g. progress dots). */
  headerCenterOverlay?: React.ReactNode
  /** When provided, overrides the native header's left slot (e.g. a page-aware
   * back button). Applied via navigation.setOptions while mounted. */
  renderHeaderLeft?: () => JSX.Element | null
  /** Forwarded to ScrollScreen — hide the compact fading navigation title
   * (e.g. when a header-center overlay already conveys progress). */
  showNavigationHeaderTitle?: boolean
  /** Grow the scroll content to fill the sheet and vertically center the
   * children. Use for short, confirmation-style content (icon + prompt). */
  centerContent?: boolean
} & ActionButtonsProps): JSX.Element => {
  const navigation = useNavigation()
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false)

  const handleScrolledToEnd = useCallback((reachedEnd: boolean) => {
    setHasScrolledToEnd(reachedEnd)
  }, [])

  // Drive the native header's left slot from the caller. Only touch the option
  // when a renderer is provided so screens that rely on the static modal
  // headerLeft (the default dismiss BackBarButton) are left untouched.
  useEffect(() => {
    if (!renderHeaderLeft) return
    navigation.setOptions({ headerLeft: renderHeaderLeft })
  }, [navigation, renderHeaderLeft])

  const adjustedConfirm = useMemo(() => {
    if (requireScrollToConfirm)
      return {
        ...confirm,
        disabled: confirm.disabled || !hasScrolledToEnd
      }
    return confirm
  }, [confirm, hasScrolledToEnd, requireScrollToConfirm])
  React.useEffect(() => {
    const onBackPress = (): boolean => {
      // modal is being dismissed via physical back button
      onClose()
      return false
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    )

    return () => backHandler.remove()
  }, [onClose])

  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      if (
        e.data.action.type === 'POP' // gesture dismissed
      ) {
        // modal is being dismissed via gesture or back button
        onClose()
      }
    })
  }, [navigation, onClose, alert])

  const renderFooter = useCallback(() => {
    if (renderFooterOverride) {
      const overrideResult = renderFooterOverride()
      if (overrideResult != null) return overrideResult
    }
    return (
      <ActionButtons confirm={adjustedConfirm} cancel={cancel} alert={alert} />
    )
  }, [renderFooterOverride, adjustedConfirm, cancel, alert])

  return (
    <ScrollScreen
      title={title}
      isModal={isModal}
      shouldAvoidKeyboard={shouldAvoidKeyboard}
      titleSx={{
        maxWidth: '80%'
      }}
      navigationTitle={navigationTitle}
      showNavigationHeaderTitle={showNavigationHeaderTitle}
      headerCenterOverlay={headerCenterOverlay}
      renderFooter={renderFooter}
      onScrolledToEnd={requireScrollToConfirm ? handleScrolledToEnd : undefined}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 0,
        // Let the content fill the sheet so `justifyContent` can vertically
        // center it (a ScrollView otherwise sizes its content to its children).
        ...(centerContent ? { flexGrow: 1 } : {})
      }}>
      <View
        sx={{
          flex: 1,
          ...(centerContent ? { justifyContent: 'center' } : {}),
          ...sx
        }}>
        {children}
      </View>
    </ScrollScreen>
  )
}
