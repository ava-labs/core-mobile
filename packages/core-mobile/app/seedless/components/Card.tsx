import { Pressable, Text, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import CarrotSVG from 'components/svg/CarrotSVG'
import React from 'react'

interface Props {
  onPress?: () => void
  icon: JSX.Element
  title: string
  body?: string
  showCaret?: boolean
  bodyVariant?: 'body2' | 'buttonLarge'
}

export const Card = ({
  onPress,
  icon,
  title,
  body,
  showCaret = false,
  bodyVariant = 'body2'
}: Props): JSX.Element => {
  const bodyColor = bodyVariant === 'body2' ? '$neutral400' : '$neutral50'

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          sx={{
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: pressed ? '$neutral850' : '$neutral900',
            padding: 16,
            marginVertical: 8
          }}>
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              flex: 1
            }}>
            {icon}
            <Space x={16} />
            <View sx={{ marginHorizontal: 8, flex: 1 }}>
              <Text variant="buttonMedium" sx={{ color: '$neutral50' }}>
                {title}
              </Text>
              {body && body.length > 0 && (
                <>
                  <Space y={4} />
                  <Text variant={bodyVariant} sx={{ color: bodyColor }}>
                    {body}
                  </Text>
                </>
              )}
            </View>
          </View>
          {showCaret && (
            <>
              <Space x={16} />
              <CarrotSVG size={18} />
            </>
          )}
        </View>
      )}
    </Pressable>
  )
}
