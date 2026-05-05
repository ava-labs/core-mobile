import React from 'react'
import {
  alpha,
  Card,
  SxProp,
  Text,
  useTheme,
  View,
  Icons,
  Separator,
  TouchableOpacity
} from '@avalabs/k2-alpine'
import {
  RecoveryMethod,
  RecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'

export const RecoveryMethodList = ({
  data,
  sx,
  onPress,
  selectedType
}: {
  data: RecoveryMethod[]
  sx?: SxProp
  onPress: (type: RecoveryMethod) => void
  selectedType?: RecoveryMethods
}): React.JSX.Element | undefined => {
  const {
    theme: { colors }
  } = useTheme()
  const selectedRowBg = alpha(colors.$primary, 0.12)

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
      {data.map((item, index) => {
        const isSelected = item.type === selectedType
        return (
        <TouchableOpacity
          key={index}
          sx={{
            width: '100%',
            backgroundColor: isSelected ? selectedRowBg : 'transparent'
          }}
          onPress={() => onPress(item)}>
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
                <View sx={{ gap: 3, paddingRight: 25, flexShrink: 1 }}>
                  <Text
                    sx={{
                      fontSize: 16,
                      fontWeight: '500',
                      lineHeight: 16,
                      color: colors.$textPrimary
                    }}>
                    {item.title}
                  </Text>
                  <Text
                    sx={{
                      fontSize: 12,
                      fontWeight: '400',
                      lineHeight: 15,
                      color: colors.$textSecondary
                    }}>
                    {item.description}
                  </Text>
                </View>
                <Icons.Navigation.ChevronRightV2
                  width={22}
                  color={colors.$textPrimary}
                />
              </View>
            </View>
            {index !== data.length - 1 && (
              <Separator sx={{ marginLeft: 16 + 22 + 16 }} />
            )}
          </>
        </TouchableOpacity>
        )
      })}
    </Card>
  )
}
