import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { useTheme } from '../../hooks'

export const BalanceLoader = ({
  hideSubtitle
}: {
  hideSubtitle?: boolean
}): React.JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  const backgroundColor = isDark ? '#3E3E43' : '#F2F2F3'
  const foregroundColor = isDark ? '#69696D' : '#D9D9D9'

  const height = hideSubtitle ? 36 : 65
  const width = 160

  return (
    <ContentLoader
      speed={1}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}>
      <Rect x="0" y="0" rx="12" ry="12" width={width} height="36" />
      {!hideSubtitle && (
        <Rect x="0" y="40" rx="9" ry="9" width="93" height="18" />
      )}
    </ContentLoader>
  )
}
