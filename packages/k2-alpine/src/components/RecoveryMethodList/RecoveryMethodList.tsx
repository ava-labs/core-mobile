import { Pressable, SxProp, View } from 'dripsy'
import React, { FC, useState } from 'react'
import { useDripsyTheme as useTheme } from 'dripsy'
import { SvgProps } from 'react-native-svg'
import { FlatList, Text } from '../Primitives'
import Check from '../../assets/icons/check.svg'
import { Card } from '../../components/Card/Card'
import { Separator } from '../Separator/Separator'

type Data = {
  title: string
  description: string
  icon: FC<SvgProps>
}

export const RecoveryMethodList = ({
  data,
  sx
}: {
  data: Data[]
  sx?: SxProp
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [selectedId, setSelectedId] = useState<string>()

  const renderItem = (item: Data): React.JSX.Element => {
    const isSelected = selectedId === item.title
    const isLastItem = data.indexOf(item) === data.length - 1
    const Icon = item.icon

    return (
      <Pressable
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 1,
          borderRadius: 12
        }}
        onPress={() => setSelectedId(item.title)}>
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
                  fontWeight: '500',
                  lineHeight: 15,
                  color: colors.$textSecondary,
                  marginTop: 3
                }}>
                {item.description}
              </Text>
            </View>
            {isSelected ? (
              <Check width={15} color={colors.$textPrimary} />
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
        sx={{ width: '100%' }}
        data={data}
        renderItem={item => renderItem(item.item as Data)}
        keyExtractor={item => (item as Data).title}
      />
    </Card>
  )
}
