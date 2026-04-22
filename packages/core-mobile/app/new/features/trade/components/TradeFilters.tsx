import {
  alpha,
  AnimatedPressable,
  Chip,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { ScrollView, StyleProp, ViewStyle } from 'react-native'

export type TradeFilterChip =
  | string
  | {
      label: string
      renderLeft?: () => JSX.Element
      style?: StyleProp<ViewStyle>
    }

const getChipLabel = (chip: TradeFilterChip): string =>
  typeof chip === 'string' ? chip : chip.label

export const TradeFilters = ({
  chips,
  selectedChip,
  onSelectChip,
  onSearchPress,
  testID
}: {
  chips: TradeFilterChip[]
  selectedChip: string
  onSelectChip: (chip: string) => void
  onSearchPress?: () => void
  testID?: string
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      testID={testID}
      style={{
        gap: 10,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
      <View sx={{ flex: 1 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 8,
            paddingLeft: 16
          }}>
          {chips.map(chip => {
            const label = getChipLabel(chip)
            const isSelected = label === selectedChip
            const renderLeft =
              typeof chip === 'string' ? undefined : chip.renderLeft
            const style = typeof chip === 'string' ? undefined : chip.style

            return (
              <Chip
                key={label}
                size="large"
                isSelected={isSelected}
                onPress={() => onSelectChip(label)}
                renderLeft={renderLeft}
                style={style}>
                {label}
              </Chip>
            )
          })}
        </ScrollView>

        <LinearGradient
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 42,
            pointerEvents: 'none'
          }}
          colors={[
            theme.colors.$surfacePrimary,
            alpha(theme.colors.$surfacePrimary, 0)
          ]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
        />
      </View>

      <AnimatedPressable
        onPress={onSearchPress}
        style={{
          backgroundColor: theme.colors.$surfaceSecondary,
          borderRadius: 20,
          height: 27,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 10,
          paddingRight: 18,
          marginRight: 16
        }}>
        <Icons.Custom.Search
          color={theme.colors.$textPrimary}
          width={14}
          height={14}
        />
        <Text variant="buttonSmall" sx={{ color: theme.colors.$textSecondary }}>
          Search
        </Text>
      </AnimatedPressable>
    </View>
  )
}
