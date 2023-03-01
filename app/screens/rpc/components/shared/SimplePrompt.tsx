import AvaText from 'components/AvaText'
import React, { FC } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import RpcRequestBottomSheet from './RpcRequestBottomSheet'

interface Props {
  onApprove: () => void
  onReject: () => void
  header: string
  description: string
  renderIcon: () => React.ReactNode
  renderContent?: () => React.ReactNode
  isApproving?: boolean
}

const SimplePrompt: FC<Props> = ({
  onApprove,
  onReject,
  header,
  description,
  renderIcon,
  renderContent,
  isApproving
}) => {
  const theme = useApplicationContext().theme

  return (
    <RpcRequestBottomSheet onClose={onReject}>
      <NativeViewGestureHandler>
        <View style={styles.container}>
          <AvaText.LargeTitleBold>{header}</AvaText.LargeTitleBold>
          <Space y={35} />
          <View style={styles.subTitleView}>
            <OvalTagBg
              style={{
                height: 80,
                width: 80,
                backgroundColor: theme.colorBg3
              }}>
              {renderIcon()}
            </OvalTagBg>
            <Space y={15} />
            <AvaText.Body1 textStyle={styles.subTileText}>
              {description}
            </AvaText.Body1>
            <Space y={16} />
          </View>
          {renderContent?.()}
          <FlexSpacer />
          <View style={styles.actionContainer}>
            <AvaButton.PrimaryMedium disabled={isApproving} onPress={onApprove}>
              {isApproving && <ActivityIndicator />} Approve
            </AvaButton.PrimaryMedium>
            <Space y={21} />
            <AvaButton.SecondaryMedium onPress={onReject}>
              Reject
            </AvaButton.SecondaryMedium>
          </View>
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
  subTileText: {
    textAlign: 'center'
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 16,
    paddingHorizontal: 24
  }
})

export default SimplePrompt
