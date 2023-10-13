import React, { useState } from 'react'
import { LayoutRectangle, StyleProp, ViewStyle } from 'react-native'
import Badge from './Badge'

interface TopRightBadgeProps {
  text: string
  style?: StyleProp<ViewStyle>
  offset?: { x: number; y: number }
}

const TopRightBadge = ({ text, style, offset }: TopRightBadgeProps) => {
  const [activityTabBadgeLayout, setActivityTabBadgeLayout] =
    useState<LayoutRectangle>()

  return (
    <Badge
      text={text}
      style={[
        {
          position: 'absolute',
          top: activityTabBadgeLayout
            ? -activityTabBadgeLayout.height / 2 + (offset?.x ?? 0)
            : undefined,
          right: activityTabBadgeLayout
            ? -activityTabBadgeLayout.width / 2 + (offset?.y ?? 0)
            : undefined
        },
        style
      ]}
      onLayout={layout => {
        setActivityTabBadgeLayout(layout)
      }}
    />
  )
}

export default TopRightBadge
