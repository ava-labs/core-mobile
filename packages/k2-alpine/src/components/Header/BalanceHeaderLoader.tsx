import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { useTheme } from '../../hooks'

export const BalanceLoader = (): React.JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  const backgroundColor = isDark ? '#3E3E43' : '#F2F2F3'
  const foregroundColor = isDark ? '#69696D' : '#D9D9D9'

  return (
    <ContentLoader
      speed={1}
      width={390}
      height={61.5}
      viewBox="0 0 400 61.5"
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}>
      <Rect x="0" y="0" rx="12" ry="12" width="203" height="36" />
      <Rect x="0" y="40" rx="9" ry="9" width="93" height="18" />
    </ContentLoader>
  )
}
