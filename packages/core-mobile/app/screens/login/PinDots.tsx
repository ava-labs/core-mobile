import DotSVG from 'components/svg/DotSVG'
import React from 'react'
import { useTheme } from '@avalabs/k2-mobile'
/**
 * Optimized pin dots so that it renders as fast as iPhone pin enter
 */
export const PinDots = ({ pinLength }: { pinLength: number }): JSX.Element => {
  const { theme } = useTheme()

  return (
    <>
      <DotSVG
        fillColor={pinLength > 0 ? theme.colors.$blueMain : undefined}
        borderColor={theme.colors.$neutral400}
        key={1}
      />
      <DotSVG
        fillColor={pinLength > 1 ? theme.colors.$blueMain : undefined}
        borderColor={theme.colors.$neutral400}
        key={2}
      />
      <DotSVG
        fillColor={pinLength > 2 ? theme.colors.$blueMain : undefined}
        borderColor={theme.colors.$neutral400}
        key={3}
      />
      <DotSVG
        fillColor={pinLength > 3 ? theme.colors.$blueMain : undefined}
        borderColor={theme.colors.$neutral400}
        key={4}
      />
      <DotSVG
        fillColor={pinLength > 4 ? theme.colors.$blueMain : undefined}
        borderColor={theme.colors.$neutral400}
        key={5}
      />
      <DotSVG
        fillColor={pinLength > 5 ? theme.colors.$blueMain : undefined}
        borderColor={theme.colors.$neutral400}
        key={6}
      />
    </>
  )
}
