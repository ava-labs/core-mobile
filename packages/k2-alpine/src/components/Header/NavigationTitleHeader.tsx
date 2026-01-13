import React, { memo } from 'react'
import { Text, View } from '../Primitives'
import { MaskedText } from '../MaskedText/MaskedText'
import { SCREEN_WIDTH } from '../../const'

export const NavigationTitleHeader = memo(
  ({
    title,
    subtitle,
    shouldMaskSubtitle = false,
    renderMaskedSubtitle
  }: {
    title: string
    subtitle?: string
    shouldMaskSubtitle?: boolean
    renderMaskedSubtitle?: () => React.ReactNode
  }): JSX.Element => {
    return (
      <View
        style={[
          {
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            alignSelf: 'center'
          }
        ]}>
        <Text
          numberOfLines={1}
          sx={{
            fontSize: 17,
            lineHeight: 20,
            fontFamily: 'Inter-SemiBold',
            textAlign: 'center',
            maxWidth: SCREEN_WIDTH - 60 * 2
          }}>
          {title}
        </Text>
        {subtitle &&
          (shouldMaskSubtitle && renderMaskedSubtitle ? (
            renderMaskedSubtitle()
          ) : (
            <MaskedText
              numberOfLines={1}
              variant="caption"
              sx={{ color: '$textSecondary' }}
              shouldMask={shouldMaskSubtitle}>
              {subtitle}
            </MaskedText>
          ))}
      </View>
    )
  },
  (prevProps, nextProps) =>
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.shouldMaskSubtitle === nextProps.shouldMaskSubtitle
)
