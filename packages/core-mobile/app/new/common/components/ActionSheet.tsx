import { SxProp, View } from '@avalabs/k2-alpine'
import React, { useCallback, useEffect } from 'react'
import { BackHandler } from 'react-native'

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
  shouldAvoidKeyboard
}: {
  title?: string
  navigationTitle?: string
  onClose: () => void
  children: React.ReactNode
  sx?: SxProp
  isModal?: boolean
  shouldAvoidKeyboard?: boolean
} & ActionButtonsProps): JSX.Element => {
  const navigation = useNavigation()

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
    return <ActionButtons confirm={confirm} cancel={cancel} alert={alert} />
  }, [confirm, cancel, alert])

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
      contentContainerStyle={{
        padding: 16,
        paddingTop: 0
      }}>
      <View sx={{ flex: 1, ...sx }}>{children}</View>
    </ScrollScreen>
  )
}
