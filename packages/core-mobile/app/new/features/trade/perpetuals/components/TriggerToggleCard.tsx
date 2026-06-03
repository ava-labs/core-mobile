import {
  Icons,
  Separator,
  Text,
  Toggle,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import Animated, { Easing, LinearTransition } from 'react-native-reanimated'

interface TriggerToggleCardProps {
  title: string
  subtitle: string
  enabled: boolean
  onToggle: (next: boolean) => void
  drillLabel: string
  drillValue?: string
  onPressDrill: () => void
}

// Built as a bespoke card rather than a GroupList accordion: GroupList toggles
// expansion on row press, which conflicts with driving it from the switch.
export const TriggerToggleCard = ({
  title,
  subtitle,
  enabled,
  onToggle,
  drillLabel,
  drillValue,
  onPressDrill
}: TriggerToggleCardProps): JSX.Element => {
  const { theme } = useTheme()

  return (
    <Animated.View
      layout={LinearTransition.easing(Easing.inOut(Easing.ease))}
      style={{
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: theme.colors.$surfaceSecondary
      }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14
        }}>
        <View sx={{ flex: 1, gap: 2 }}>
          <Text variant="subtitle1" sx={{ fontSize: 16 }}>
            {title}
          </Text>
          <Text
            variant="caption"
            sx={{ color: '$textSecondary', fontSize: 13, lineHeight: 18 }}>
            {subtitle}
          </Text>
        </View>
        <Toggle value={enabled} onValueChange={onToggle} />
      </View>

      {enabled && (
        <>
          <Separator sx={{ marginHorizontal: 16 }} />
          <TouchableOpacity onPress={onPressDrill}>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 16
              }}>
              <Text variant="subtitle1" sx={{ fontSize: 16 }}>
                {drillLabel}
              </Text>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text variant="body1" sx={{ color: '$textSecondary' }}>
                  {drillValue ?? 'Set price'}
                </Text>
                <Icons.Navigation.ChevronRight
                  color={theme.colors.$textSecondary}
                />
              </View>
            </View>
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  )
}
