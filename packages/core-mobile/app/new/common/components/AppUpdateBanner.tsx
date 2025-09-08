import React from 'react'
import { Button, Logos, Text, View } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectSelectedColorScheme } from 'store/settings/appearance'
import { AppUpdateService } from 'services/AppUpdateService/AppUpdateService'

export const AppUpdateBanner = (): JSX.Element => {
  const selectedColorScheme = useSelector(selectSelectedColorScheme)

  const handleUpdate = (): void => {
    AppUpdateService.performUpdate()
  }

  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
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
          {selectedColorScheme === 'dark' ? (
            <Logos.AppIcons.CoreAppIconLight
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          ) : (
            <Logos.AppIcons.CoreAppIconDark
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          )}
        </View>
        <View sx={{ flexShrink: 1, flexWrap: 'wrap' }}>
          <View>
            <Text variant="buttonSmall">A newer version is available!</Text>
            <Text variant="caption" sx={{ color: '$textSecondary' }}>
              Update the app for the best and safest experience
            </Text>
          </View>
        </View>
      </View>
      <Button type="secondary" size="small" onPress={handleUpdate}>
        Update
      </Button>
    </View>
  )
}

const ICON_SIZE = 42
