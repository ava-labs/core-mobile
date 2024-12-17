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
import { RecoveryMethod, RecoveryMethodData } from '../types'

export const RecoveryMethodList = ({
  selectedMethod,
  data,
  sx,
  onPress
}: {
  selectedMethod: RecoveryMethod
  data: RecoveryMethodData[]
  sx?: SxProp
  onPress: (type: RecoveryMethod) => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const renderItem = (item: RecoveryMethodData): React.JSX.Element => {
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

  return (
    <Card sx={{ paddingRight: 0, ...sx }}>
      <FlatList
        scrollEnabled={false}
        sx={{ width: '100%', backgroundColor: '$surfaceSecondary' }}
        data={data}
        renderItem={item => renderItem(item.item as RecoveryMethodData)}
        keyExtractor={item => (item as RecoveryMethodData).type}
      />
    </Card>
  )
}
