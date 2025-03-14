import React from 'react'
import {
  TouchableOpacity,
  Text,
  Icons,
  View,
  Separator
} from '@avalabs/k2-alpine'
import { Dimensions } from 'react-native'
import DeviceInfo from 'react-native-device-info'

const SCREEN_WIDTH = Dimensions.get('window').width

export const About = ({
  selectSendFeedback,
  selectLegal,
  selectHelpCenter
}: {
  selectSendFeedback: () => void
  selectLegal: () => void
  selectHelpCenter: () => void
}): React.JSX.Element => {
  const version = DeviceInfo.getReadableVersion()

  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        width: SCREEN_WIDTH - 32
      }}>
      {/* Send feedback */}
      <TouchableOpacity
        sx={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
        onPress={selectSendFeedback}>
        <Text
          variant="body2"
          sx={{ color: '$textPrimary', fontSize: 16, lineHeight: 22 }}>
          Send feedback
        </Text>
        <Icons.Navigation.ChevronRightV2 />
      </TouchableOpacity>
      <Separator sx={{ marginHorizontal: 16 }} />

      {/* Legal */}
      <TouchableOpacity
        sx={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
        onPress={selectLegal}>
        <Text
          variant="body2"
          sx={{ color: '$textPrimary', fontSize: 16, lineHeight: 22 }}>
          Legal
        </Text>
        <Icons.Navigation.ChevronRightV2 />
      </TouchableOpacity>

      {/* Help center */}
      <TouchableOpacity
        sx={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
        onPress={selectHelpCenter}>
        <Text
          variant="body2"
          sx={{ color: '$textPrimary', fontSize: 16, lineHeight: 22 }}>
          Help center
        </Text>
        <Icons.Navigation.ChevronRightV2 />
      </TouchableOpacity>

      {/* App version */}
      <View
        sx={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}>
        <Text
          variant="body2"
          sx={{ color: '$textPrimary', fontSize: 16, lineHeight: 22 }}>
          App version
        </Text>
        <Text
          variant="body2"
          sx={{ color: '$textSecondary', fontSize: 16, lineHeight: 22 }}>
          {version}
        </Text>
      </View>
    </View>
  )
}
