import {
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import Animated, { Easing, LinearTransition } from 'react-native-reanimated'

export const AccountListItem = ({
  testID,
  title,
  subtitle,
  leftIcon,
  onPress,
  onLongPress
}: {
  testID: string
  title: string
  subtitle: string
  leftIcon: React.ReactNode
  onPress: () => void
  onLongPress: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  return (
    <Animated.View
      layout={LinearTransition.easing(Easing.inOut(Easing.ease))}
      style={[
        {
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: theme.colors.$surfaceSecondary
        }
      ]}>
      <View sx={{}}>
        <TouchableOpacity
          testID={testID ? testID : `list_item__${title}`}
          onPress={onPress}
          disabled={!onPress}
          onLongPress={onLongPress}>
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              paddingHorizontal: 16
            }}>
            {leftIcon}
            <View
              sx={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
              <View sx={{ marginVertical: 14 }}>
                <View
                  sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  }}>
                  <Text
                    testID={`manage_accounts_list__${name}`}
                    variant="body1"
                    numberOfLines={2}
                    sx={{
                      color: theme.colors.$textPrimary,
                      fontSize: 15,
                      fontFamily: 'Inter-Medium',
                      lineHeight: 16
                    }}>
                    {title}
                  </Text>
                </View>
                <Text
                  sx={{
                    color: '$textSecondary',
                    fontSize: 13,
                    lineHeight: 18
                  }}>
                  {subtitle}
                </Text>
              </View>

              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  flex: 1,
                  justifyContent: 'flex-end'
                }}></View>
            </View>
          </View>
          {item.bottomAccessory}
        </TouchableOpacity>

        {accordion !== undefined && expandedStates[index] && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Separator
              sx={{
                marginLeft: textMarginLeft,
                marginRight: separatorMarginRight
              }}
            />
            {accordion}
          </Animated.View>
        )}
        {index < data.length - 1 && (
          <Separator
            sx={{
              opacity: hideSeparator ? 0 : 1,
              marginLeft: textMarginLeft,
              marginRight: separatorMarginRight
            }}
          />
        )}
      </View>
    </Animated.View>
  )
}
