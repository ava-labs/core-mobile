import React from 'react'
import {
  Card,
  SxProp,
  Text,
  useTheme,
  View,
  Separator,
  Button
} from '@avalabs/k2-alpine'
import {
  RecoveryMethod,
  RecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'

export const ManageRecoveryMethods = ({
  data,
  sx,
  onPress
}: {
  data: RecoveryMethod[]
  sx?: SxProp
  onPress: (type: RecoveryMethod) => void
}): React.JSX.Element | undefined => {
  const {
    theme: { colors }
  } = useTheme()

  if (data.length === 0) {
    return undefined
  }

  return (
    <Card
      sx={{
        ...sx,
        padding: 0,
        paddingVertical: 8,
        alignItems: 'flex-start'
      }}>
      {data.map((item, index) => (
        <View key={index} sx={{ width: '100%' }}>
          <>
            <View
              sx={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16
              }}>
              <item.icon color={colors.$textPrimary} width={22} height={22} />
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexShrink: 1,
                  flexGrow: 1,
                  justifyContent: 'space-between'
                }}>
                <Text
                  sx={{
                    fontSize: 16,
                    fontWeight: '500',
                    lineHeight: 16,
                    color: colors.$textPrimary
                  }}>
                  {item.title}
                </Text>
                <Button
                  type="primary"
                  size="small"
                  onPress={() => onPress(item)}>
                  {item.type === RecoveryMethods.Authenticator
                    ? 'Change'
                    : 'Remove'}
                </Button>
              </View>
            </View>
            {index !== data.length - 1 && (
              <Separator sx={{ marginLeft: 16 + 22 + 16 }} />
            )}
          </>
        </View>
      ))}
    </Card>
  )
}
