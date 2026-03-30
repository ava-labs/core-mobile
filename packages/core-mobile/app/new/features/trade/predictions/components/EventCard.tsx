import { AnimatedPressable, Text, View, useTheme } from '@avalabs/k2-alpine'
import { EventResponse } from '@avalabs/prediction-market-sdk'
import React from 'react'
import { EventCardOption } from './EventCardOption'

interface EventCardProps {
  event: EventResponse
  options: EventCardOption[]
  onPress?: () => void
}

/**
 * Displays a single tradable Kalshi market card.
 *
 * Does NOT accept a width prop — fills its container.
 * In BrowseScreen, wrap each card in a View with sx={{ flex: 1, marginHorizontal: 7, marginBottom: 13 }}.
 *
 * Each option row renders a fill bar (proportional to probability) with the label
 * and percentage overlaid inside, matching the Figma masonry card design.
 */
export function EventCard({
  event,
  options,
  onPress
}: EventCardProps): JSX.Element {
  const { theme } = useTheme()

  const isLive = false

  return (
    <AnimatedPressable
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.$borderPrimary,
        backgroundColor: theme.colors.$surfaceSecondary
      }}>
      <View
        sx={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
          marginBottom: 8
        }}>
        {/* {event.markets[0].imageUrl ? (
          <TradeThumbnail url={event.markets[0].imageUrl} />
        ) : null} */}
        {isLive ? (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ff2a6d',
              borderRadius: 100,
              borderWidth: 1,
              borderColor: theme.colors.$borderPrimary,
              paddingHorizontal: 6,
              gap: 4,
              height: 16,
              alignSelf: 'flex-start'
            }}>
            <View
              sx={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.colors.$white
              }}
            />
            <Text
              variant="caption"
              sx={{
                fontFamily: 'Inter-Medium',
                lineHeight: 12,
                color: theme.colors.$white
              }}>
              Live
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        variant="heading4"
        sx={{ marginBottom: 16, lineHeight: 22 }}
        numberOfLines={4}>
        {event.title ?? ''}
      </Text>

      <View sx={{ gap: 4 }}>
        {options.map(option => (
          <EventCardOption key={option.label} option={option} />
        ))}
      </View>
    </AnimatedPressable>
  )
}
