import { useApplicationContext } from 'contexts/ApplicationContext'
import * as React from 'react'
import Svg, { G, Path, Circle, Defs, ClipPath } from 'react-native-svg'

const StakeLogoBigSVG = () => {
  const { theme } = useApplicationContext()

  return (
    <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
      <G clipPath="url(#clip0_13770_153170)">
        <Path
          d="M51.737 10.979H12.22v35.914h39.516V10.978z"
          fill={theme.colorIcon1}
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M63.979 32c0 17.65-14.318 31.958-31.979 31.958S.021 49.65.021 32 14.34.043 32 .043 63.979 14.351 63.979 32zm-41.04 12.718h-6.207c-1.304 0-1.948 0-2.341-.251a1.576 1.576 0 01-.715-1.233c-.024-.463.299-1.028.943-2.159l15.323-26.992c.652-1.146.982-1.72 1.399-1.931a1.582 1.582 0 011.43 0c.416.211.746.785 1.398 1.93l3.15 5.496.016.028c.704 1.23 1.062 1.853 1.218 2.508a4.659 4.659 0 010 2.183c-.157.659-.511 1.287-1.226 2.535l-8.05 14.22-.02.036c-.709 1.24-1.068 1.868-1.566 2.342a4.686 4.686 0 01-1.91 1.107c-.651.18-1.382.18-2.843.18zm15.672 0h8.892c1.312 0 1.972 0 2.365-.259.424-.275.691-.738.715-1.24.023-.448-.292-.992-.91-2.057a15.29 15.29 0 01-.064-.11l-4.454-7.615-.051-.086c-.626-1.058-.942-1.592-1.348-1.799a1.565 1.565 0 00-1.422 0c-.408.212-.738.77-1.39 1.892l-4.439 7.616-.015.026c-.65 1.12-.974 1.68-.95 2.14.03.503.29.966.714 1.24.385.252 1.045.252 2.357.252z"
          fill={theme.tokenLogoBg}
        />
      </G>
      <Circle
        cx={56}
        cy={56}
        r={7.5}
        fill={theme.blueDark}
        stroke={theme.colorBg2}
      />
      <Path
        d="M52.093 58.882l2.65-2.65 1.625 1.624a.496.496 0 00.725-.02l3.585-4.035a.5.5 0 00-.745-.665l-3.195 3.59-1.645-1.645a.498.498 0 00-.705 0l-3.045 3.05a.498.498 0 000 .706l.045.044a.498.498 0 00.705 0z"
        fill={theme.colorIcon1}
      />
      <Defs>
        <ClipPath id="clip0_13770_153170">
          <Path fill={theme.colorIcon1} d="M0 0H64V64H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default StakeLogoBigSVG
