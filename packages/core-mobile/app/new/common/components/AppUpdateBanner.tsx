import React from 'react'
import { ActivityIndicator, Button, Text, View } from '@avalabs/k2-alpine'
import { useUpdateApp } from 'common/hooks/useUpdateApp'
import { Image } from 'expo-image'
import {
  ICON_PREVIEWS,
  useCurrentAppIcon
} from 'features/accountSettings/store'

export const AppUpdateBanner = (): JSX.Element => {
  const { updateApp, isUpdating } = useUpdateApp()
  const currentIcon = useCurrentAppIcon()
  const iconSource = ICON_PREVIEWS[currentIcon]

  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        // Android (Fabric) can mis-measure this row's intrinsic height to ~0
        // when it contains flex children, which makes the banner paint over the
        // settings rows below it. A minHeight floor (icon height + vertical
        // padding) guarantees the banner always reserves real layout space so
        // the rows are pushed down. It only sets a floor, so the banner still
        // grows if the text wraps; no-op on iOS where measurement is correct.
        minHeight: ICON_SIZE + 30
      }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          flexShrink: 1,
          gap: 12
        }}>
        <View
          sx={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: 12,
            overflow: 'hidden'
          }}>
          <Image
            source={iconSource}
            style={{ width: ICON_SIZE, height: ICON_SIZE }}
            contentFit="cover"
          />
        </View>
        <View sx={{ flex: 1 }}>
          <Text
            sx={{
              fontFamily: 'Inter-Medium',
              fontSize: 13,
              lineHeight: 15
            }}>
            A newer version is available!
          </Text>
          <Text
            variant="caption"
            sx={{ color: '$textSecondary', fontSize: 13, lineHeight: 15 }}>
            Update now for the best crypto experience
          </Text>
        </View>
      </View>
      <Button
        type="secondary"
        size="small"
        onPress={updateApp}
        disabled={isUpdating}>
        {isUpdating ? <ActivityIndicator /> : 'Update'}
      </Button>
    </View>
  )
}

const ICON_SIZE = 42
