import AvaText from 'components/AvaText'
import React, { FC } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'

interface Props {
  onApprove: () => void
  onReject: () => void
  header: string
  description: string
  renderIcon: () => React.ReactNode
  renderContent: () => React.ReactNode
}

const SimplePrompt: FC<Props> = ({
  onApprove,
  onReject,
  header,
  description,
  renderIcon,
  renderContent
}) => {
  const theme = useApplicationContext().theme

  return (
    <NativeViewGestureHandler>
      <SafeAreaView style={styles.safeView}>
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
        <Space y={30} />
        {renderContent()}
        <FlexSpacer />
        <View style={styles.actionContainer}>
          <AvaButton.PrimaryMedium onPress={onApprove}>
            Approve
          </AvaButton.PrimaryMedium>
          <Space y={21} />
          <AvaButton.SecondaryMedium onPress={onReject}>
            Reject
          </AvaButton.SecondaryMedium>
        </View>
      </SafeAreaView>
    </NativeViewGestureHandler>
  )
}

const styles = StyleSheet.create({
  safeView: {
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
