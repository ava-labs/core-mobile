import React from 'react'
import {
  TouchableOpacity,
  Text,
  Icons,
  View,
  Separator
} from '@avalabs/k2-alpine'
import { Dimensions } from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width

export const UserPreferences = ({
  selectSecurityPrivacy,
  selectNotificationPreferences
}: {
  selectSecurityPrivacy: () => void
  selectNotificationPreferences: () => void
}): React.JSX.Element => {
  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        width: SCREEN_WIDTH - 32
      }}>
      {/* Security and preferences */}
      <TouchableOpacity
        sx={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
        onPress={selectSecurityPrivacy}>
        <Text
          variant="body2"
          sx={{ color: '$textPrimary', fontSize: 16, lineHeight: 22 }}>
          Security & privacy
        </Text>
        <Icons.Navigation.ChevronRightV2 />
      </TouchableOpacity>
      <Separator sx={{ marginHorizontal: 16 }} />

      {/* Notification preferences */}
      <TouchableOpacity
        sx={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
        onPress={selectNotificationPreferences}>
        <Text
          variant="body2"
          sx={{ color: '$textPrimary', fontSize: 16, lineHeight: 22 }}>
          Notification preferences
        </Text>
        <Icons.Navigation.ChevronRightV2 />
      </TouchableOpacity>
    </View>
  )
}
