import React from 'react'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { BaseCard, DEFAULT_CARD_WIDTH, getCardHeight } from './BaseCard'

export const AddCard = ({
  width = DEFAULT_CARD_WIDTH
}: AddCardProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const height = getCardHeight(width)

  return (
    <BaseCard
      sx={{ justifyContent: 'center', alignItems: 'center', width, height }}>
      <Icons.Content.Add width={40} height={40} color={colors.$textPrimary} />
    </BaseCard>
  )
}

export type AddCardProps = {
  width?: number
}
