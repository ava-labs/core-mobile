import { useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import ContentLoader from 'react-content-loader/native'

interface SkeletonProps {
  width: number
  height: number
  /** `<Rect>` shapes describing the rows/blocks being mocked. */
  children: React.ReactNode
}

/**
 * Shared loading-skeleton wrapper for the perpetuals detail components.
 * Centralizes the ContentLoader speed and the light/dark fill colors so they
 * don't drift between MarketDetailsHeader, MarketStatistics, etc.
 */
export const Skeleton = ({
  width,
  height,
  children
}: SkeletonProps): JSX.Element => {
  const { theme } = useTheme()
  return (
    <ContentLoader
      speed={1}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      backgroundColor={theme.isDark ? '#3E3E43' : '#F2F2F3'}
      foregroundColor={theme.isDark ? '#69696D' : '#D9D9D9'}>
      {children}
    </ContentLoader>
  )
}
