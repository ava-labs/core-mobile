import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { LayoutChangeEvent, Platform, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { View, useTheme, SCREEN_HEIGHT, SxProp } from '@avalabs/k2-alpine'
/**
 * Temporarily import "useNavigation" from @react-navigation/native.
 * This is a workaround due to a render bug in the expo-router version.
 * See: https://github.com/expo/expo/issues/35383
 * TODO: Adjust import back to expo-router once the bug is resolved.
 */
import { useNavigation } from '@react-navigation/native'
import {
  ActionButtons,
  ActionButtonsProps
} from 'new/features/approval/components/ActionButtons'
import { useSimpleFadingHeader } from '../hooks/useSimpleFadingHeader'

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
  onClose,
  confirm,
  cancel,
  children,
  alert,
  sx
}: {
  title: string
  onClose: () => void
  children: (props: {
    handleHeaderLayout: (event: LayoutChangeEvent) => void
    animatedHeaderStyle: ViewStyle
  }) => React.ReactNode
  sx?: SxProp
} & ActionButtonsProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const navigation = useNavigation()

  const [increasedHeight, setIncreasedHeight] = useState<number>()

  const handleScrollViewLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setIncreasedHeight(event.nativeEvent.layout.height * 1.4)
    },
    []
  )

  const { onScroll, handleHeaderLayout, animatedHeaderStyle } =
    useSimpleFadingHeader({
      title,
      shouldHeaderHaveGrabber: true
    })

  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      if (e.data.action.type === 'POP') {
        // modal is being dismissed via gesture or back button
        onClose()
      }
    })
  }, [navigation, onClose])

  // on Android, we need to manually increase the height (1.4x content) to enable proper scrolling.
  // on iOS, this is not needed as it handles it correctly already; only a bottom contentInset is needed.
  const onLayout = useMemo(() => {
    return Platform.OS === 'android' ? handleScrollViewLayout : undefined
  }, [handleScrollViewLayout])

  const contentInset = useMemo(() => {
    if (Platform.OS === 'ios') {
      return {
        bottom: SCREEN_HEIGHT * 0.4
      }
    }
    return { bottom: 0 }
  }, [])

  const contentContainerStyle = useMemo(() => {
    return {
      flexGrow: 1,
      backgroundColor: colors.$surfacePrimary,
      paddingHorizontal: 16,
      height: Platform.OS === 'android' ? increasedHeight : undefined
    }
  }, [colors.$surfacePrimary, increasedHeight])

  return (
    <View sx={{ flex: 1, ...sx }}>
      <ScrollView
        onLayout={onLayout}
        onScroll={onScroll}
        contentInset={contentInset}
        contentContainerStyle={contentContainerStyle}>
        {children({ handleHeaderLayout, animatedHeaderStyle })}
      </ScrollView>
      <ActionButtons confirm={confirm} cancel={cancel} alert={alert} />
    </View>
  )
}
