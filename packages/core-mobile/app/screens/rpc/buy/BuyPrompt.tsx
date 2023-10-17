import AvaText from 'components/AvaText'
import React, { FC } from 'react'
import { StyleSheet, View } from 'react-native'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import RpcRequestBottomSheet from '../components/shared/RpcRequestBottomSheet'

interface Props {
  onConfirm: () => void
  onCancel: () => void
  header: string
  description: string
  renderIcon: () => React.ReactNode
  renderContent?: () => React.ReactNode
}

const BuyPrompt: FC<Props> = ({
  onConfirm,
  onCancel,
  header,
  description,
  renderIcon,
  renderContent
}) => {
  return (
    <RpcRequestBottomSheet onClose={onCancel}>
      <NativeViewGestureHandler>
        <View style={styles.container}>
          <AvaText.LargeTitleBold>{header}</AvaText.LargeTitleBold>
          <Space y={24} />
          <AvaText.Body1>{description}</AvaText.Body1>
          <Space y={75} />
          <View style={styles.subTitleView}>
            <OvalTagBg style={styles.iconContainer}>{renderIcon()}</OvalTagBg>
          </View>
          <Space y={24} />
          <View
            style={{
              alignItems: 'center'
            }}>
            {renderContent?.()}
          </View>
          <FlexSpacer />
          <View style={styles.actionContainer}>
            <AvaButton.PrimaryLarge onPress={onConfirm}>
              Confirm
            </AvaButton.PrimaryLarge>
            <Space y={16} />
            <AvaButton.SecondaryLarge onPress={onCancel}>
              Cancel
            </AvaButton.SecondaryLarge>
          </View>
          <Space y={24} />
        </View>
      </NativeViewGestureHandler>
    </RpcRequestBottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    flex: 1,
    paddingHorizontal: 16
  },
  subTitleView: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconContainer: {
    height: 64,
    width: 64
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 16,
    paddingHorizontal: 24
  }
})

export default BuyPrompt
