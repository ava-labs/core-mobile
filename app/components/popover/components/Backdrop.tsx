import React, { ReactNode, RefObject, useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import {
  ANIMATION_DURATION,
  IOS_MODAL_SUPPORTED_ORIENTATIONS
} from '../constants'

type BackdropProps = {
  children?: ReactNode
  childrenRef: RefObject<View>
  onPress: () => void
  popoverRef: RefObject<View>
  visible: boolean
}

export const Backdrop = ({
  children,
  onPress,
  visible
}: BackdropProps): JSX.Element => {
  const [delayedVisible, setDelayedVisible] = useState(visible)

  useEffect(() => {
    // When `Modal.visible` changes, the inner view gets hidden
    // immediately. This gives no time to `Popover` to animate
    // when `visible` becomes `false`. By delaying the `visible`
    // property, it gives extra time for the popover to animate,
    // then hide the modal
    if (visible) {
      setDelayedVisible(true)
    } else {
      setTimeout(() => setDelayedVisible(false), ANIMATION_DURATION)
    }
  }, [visible])

  return (
    <Modal
      visible={delayedVisible}
      onRequestClose={onPress}
      hardwareAccelerated
      transparent
      supportedOrientations={IOS_MODAL_SUPPORTED_ORIENTATIONS}>
      <Pressable onPress={onPress} style={styles.pressable}>
        {children}
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1
  }
})
