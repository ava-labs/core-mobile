import React from 'react'
import {
  Card,
  FlatList,
  Pressable,
  SxProp,
  Text,
  useTheme,
  View,
  Icons,
  Separator
} from '@avalabs/k2-alpine'
import {
  RecoveryMethod,
  RecoveryMethods
} from 'features/onboarding/hooks/useAvailableRecoveryMethods'

export const RecoveryMethodList = ({
  selectedMethod,
  data,
  sx,
  onPress
}: {
  selectedMethod?: RecoveryMethods
  data: RecoveryMethod[]
  sx?: SxProp
  onPress: (type: RecoveryMethods) => void
}): React.JSX.Element | undefined => {
  const {
    theme: { colors }
  } = useTheme()
  const renderItem = (item: RecoveryMethod): React.JSX.Element => {
    const isSelected = selectedMethod === item.type
    const isLastItem = data.indexOf(item) === data.length - 1
    const Icon = item.icon

    const handleOnPress = (): void => {
      onPress(item.type)
    }

    return (
      <Pressable
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 1,
          borderRadius: 12
        }}
        onPress={handleOnPress}>
        <View
          sx={{
            marginRight: 16,
            width: 22,
            height: 22,
            alignItems: 'center'
          }}>
          <Icon color={colors.$textPrimary} />
        </View>
        <View
          sx={{
            flex: 1
          }}>
          <View
            sx={{
              flex: 1,
              paddingRight: 17,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            <View sx={{ flex: 1, marginRight: 25 }}>
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
                  color: colors.$textSecondary,
                  marginTop: 3
                }}>
                {item.description}
              </Text>
            </View>
            {isSelected ? (
              <Icons.Navigation.Check width={15} color={colors.$textPrimary} />
            ) : (
              <View sx={{ width: 15 }} />
            )}
          </View>
          {!isLastItem && (
            <View sx={{ marginVertical: 12 }}>
              <Separator />
            </View>
          )}
        </View>
      </Pressable>
    )
  }

  if (data.length === 0) {
    return undefined
  }

  return (
    <Card sx={{ paddingRight: 0, ...sx }}>
      <FlatList
        scrollEnabled={false}
        sx={{ width: '100%', backgroundColor: '$surfaceSecondary' }}
        data={data}
        renderItem={item => renderItem(item.item as RecoveryMethod)}
        keyExtractor={item => (item as RecoveryMethod).type}
      />
    </Card>
  )
}
