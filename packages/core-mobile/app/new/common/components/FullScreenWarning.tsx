import React, { useMemo } from 'react'
import {
  useTheme,
  Text,
  View,
  Button,
  SafeAreaView,
  showAlert,
  GroupList,
  GroupListItem,
  TouchableOpacity
} from '@avalabs/k2-alpine'
import Clipboard from '@react-native-clipboard/clipboard'
import { useUserUniqueID } from 'common/hooks/useUserUniqueID'
import CoreAppIconLight from '../../assets/icons/core-app-icon-light.svg'
import CoreAppIconDark from '../../assets/icons/core-app-icon-dark.svg'

export const FullScreenWarning = ({
  title,
  description,
  error,
  action
}: {
  title: string
  description: string
  error?: unknown
  action: {
    label: string
    onPress: () => void
  }
}): JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  const userUniqueID = useUserUniqueID()

  const errorData: GroupListItem[] | undefined = useMemo(() => {
    if (!error) return undefined

    return [
      {
        title: 'View details',
        onPress: () => {
          showAlert({
            title: 'Error Details',
            description: error instanceof Error ? error.message : String(error),
            buttons: [{ text: 'Close' }]
          })
        }
      }
    ]
  }, [error])

  const handlePressUniqueUserId = (): void => {
    Clipboard.setString(userUniqueID)
    showAlert({
      title: '',
      description: 'Unique user ID copied to clipboard',
      buttons: [{ text: 'OK' }]
    })
  }

  return (
    <SafeAreaView
      sx={{
        backgroundColor: '$surfacePrimary',
        flex: 1
      }}>
      <View
        sx={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <View style={{ marginBottom: 28 }}>
          {isDark ? <CoreAppIconLight /> : <CoreAppIconDark />}
          <View
            style={{
              position: 'absolute',
              bottom: -15,
              right: -14
            }}>
            <Text variant="heading6" sx={{ fontSize: 36, lineHeight: 44 }}>
              ⚠️
            </Text>
          </View>
        </View>
        <View style={{ width: '60%' }}>
          <Text variant="heading6" sx={{ textAlign: 'center' }}>
            {title}
          </Text>
          <Text
            variant="body2"
            sx={{
              textAlign: 'center',
              fontSize: 12,
              lineHeight: 16,
              marginTop: 8,
              marginBottom: 15
            }}>
            {description}
          </Text>
        </View>
        <Button type="secondary" size="medium" onPress={action.onPress}>
          {action.label}
        </Button>
      </View>
      <View
        sx={{
          alignItems: 'center',
          gap: 3,
          marginHorizontal: 16
        }}>
        <Text
          variant="body2"
          sx={{
            textAlign: 'center',
            color: '$textSecondary'
          }}>
          Please reference this unique user ID when contacting support:
        </Text>
        <TouchableOpacity onPress={handlePressUniqueUserId}>
          <Text variant="mono">{userUniqueID}</Text>
        </TouchableOpacity>
      </View>
      {errorData && (
        <View sx={{ marginHorizontal: 16, marginVertical: 24 }}>
          <GroupList data={errorData} />
        </View>
      )}
    </SafeAreaView>
  )
}
