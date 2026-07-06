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
  requireScrollToConfirm
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
} & ActionButtonsProps): JSX.Element => {
  const navigation = useNavigation()
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false)

  const handleScrolledToEnd = useCallback((reachedEnd: boolean) => {
    setHasScrolledToEnd(reachedEnd)
  }, [])

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
      renderFooter={renderFooter}
      onScrolledToEnd={requireScrollToConfirm ? handleScrolledToEnd : undefined}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 0
      }}>
      <View sx={{ flex: 1, ...sx }}>{children}</View>
    </ScrollScreen>
  )
}
