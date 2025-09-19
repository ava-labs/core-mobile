import { Button, Text, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { withNavigationEvents } from 'common/utils/navigateWithPromise'
import { AppUpdateService } from 'services/AppUpdateService/AppUpdateService'
import { CoreLogoWithTokens } from 'common/components/CoreLogoWithTokens'
import { useLocalSearchParams } from 'expo-router'
import { useUpdateApp } from 'common/hooks/useUpdateApp'

function AppUpdateScreen(): JSX.Element {
  const { appVersion } = useLocalSearchParams<{ appVersion: string }>()
  const dispatch = useDispatch()

  const handleUpdate = useUpdateApp()

  const renderFooter = useCallback(() => {
    return (
      <Button type="primary" size="large" onPress={handleUpdate}>
        Update Core
      </Button>
    )
  }, [handleUpdate])

  useEffect(() => {
    return () => {
      AppUpdateService.markAppUpdateScreenAsSeen(appVersion)
    }
  }, [dispatch, appVersion])

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      isModal
      contentContainerStyle={{
        flex: 1,
        marginTop: 70
      }}>
      <View sx={{ alignItems: 'center', gap: 50 }}>
        <CoreLogoWithTokens />
        <View
          style={{
            gap: 13
          }}>
          <View style={{ gap: 10, maxWidth: 300 }}>
            <Text
              testID="update_app_title"
              variant="heading3"
              style={{ textAlign: 'center' }}>
              {`A new version\nof Core is available!`}
            </Text>
            <Text variant="subtitle1" style={{ textAlign: 'center' }}>
              Update now to enjoy the best way to experience crypto
            </Text>
          </View>
        </View>
      </View>
    </ScrollScreen>
  )
}

export default withNavigationEvents(AppUpdateScreen)
