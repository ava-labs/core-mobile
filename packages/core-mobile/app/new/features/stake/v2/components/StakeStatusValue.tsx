import { Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { StatusDot } from './StatusDot'

type StakeStatusValueSize = 'small' | 'large'

interface StakeStatusValueProps {
  isActive: boolean
  /**
   * Visual size variant.
   *  - `'large'` (default): used on the stake detail screen — body-sized
   *    label with a 6px dot.
   *  - `'small'`: used inside `StakeCard` — caption-sized label in
   *    Inter-Medium with a 5px dot, so it sits comfortably alongside the
   *    other caption-sized DetailRow values.
   */
  size?: StakeStatusValueSize
}

const SIZE_CONFIG: Record<
  StakeStatusValueSize,
  { dotSize: number; textVariant: 'caption' | 'body1'; fontFamily?: string }
> = {
  small: {
    dotSize: 5,
    textVariant: 'caption',
    fontFamily: 'Inter-Medium'
  },
  large: {
    dotSize: 6,
    textVariant: 'body1'
  }
}

/**
 * Renders a stake's lifecycle state as a dot + label row. Active stakes get a
 * filled success-colored dot followed by "Active"; completed stakes render as
 * a plain "Completed" label with no dot.
 */
export const StakeStatusValue = ({
  isActive,
  size = 'large'
}: StakeStatusValueProps): JSX.Element => {
  const { theme } = useTheme()
  const config = SIZE_CONFIG[size]

  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {isActive && (
        <StatusDot size={config.dotSize} color={theme.colors.$textSuccess} />
      )}
      <Text
        variant={config.textVariant}
        sx={{
          color: '$textSecondary',
          fontFamily: config.fontFamily
        }}>
        {isActive ? 'Active' : 'Completed'}
      </Text>
    </View>
  )
}
