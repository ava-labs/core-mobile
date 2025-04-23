import React, { useEffect } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { View, ScrollView, useTheme } from '@avalabs/k2-alpine'
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
  children
}: {
  title: string
  onClose: () => void
  children: (props: {
    handleHeaderLayout: (event: LayoutChangeEvent) => void
  }) => React.ReactNode
} & ActionButtonsProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const navigation = useNavigation()

  const { onScroll, handleHeaderLayout } = useSimpleFadingHeader({
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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        onScroll={onScroll}
        contentContainerStyle={{
          backgroundColor: colors.$surfacePrimary,
          paddingHorizontal: 16,
          paddingBottom: '50%'
        }}>
        {children({ handleHeaderLayout })}
      </ScrollView>
      <ActionButtons confirm={confirm} cancel={cancel} />
    </View>
  )
}
