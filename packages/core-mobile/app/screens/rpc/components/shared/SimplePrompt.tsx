import AvaText from 'components/AvaText'
import React, { FC } from 'react'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import { Button, View } from '@avalabs/k2-mobile'
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
          <View
            sx={{
              backgroundColor: '$neutral900',
              paddingVertical: 16
            }}>
            <Button
              testID="approve_button"
              type="primary"
              size="xlarge"
              onPress={onApprove}
              disabled={isApproving}>
              {isApproving && <ActivityIndicator />} Approve
            </Button>
            <Space y={16} />
            <Button
              testID="reject_button"
              type="secondary"
              size="xlarge"
              onPress={onReject}>
              Reject
            </Button>
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
  }
})

export default SimplePrompt
