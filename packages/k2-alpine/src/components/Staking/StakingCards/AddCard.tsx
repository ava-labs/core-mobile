import React from 'react'
import { useTheme } from '../../../hooks'
import { Icons } from '../../../theme/tokens/Icons'
import { BaseCard, DEFAULT_CARD_WIDTH, getCardHeight } from './BaseCard'

export const AddCard = ({
  onPress,
  width = DEFAULT_CARD_WIDTH,
  disabled
}: AddCardProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const height = getCardHeight(width)
  const tintColor = disabled ? colors.$textSecondary : colors.$textPrimary

  return (
    <BaseCard
      onPress={onPress}
      disabled={disabled}
      sx={{ justifyContent: 'center', alignItems: 'center', width, height }}>
      <Icons.Content.Add width={40} height={40} color={tintColor} />
    </BaseCard>
  )
}

export type AddCardProps = {
  onPress?: () => void
  width?: number
  disabled?: boolean
}
