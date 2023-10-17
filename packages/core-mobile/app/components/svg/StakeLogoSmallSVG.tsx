import { useApplicationContext } from 'contexts/ApplicationContext'
import * as React from 'react'
import Svg, { G, Path, Circle, Defs, ClipPath } from 'react-native-svg'

const StakeLogoSmallSVG = () => {
  const { theme } = useApplicationContext()

  return (
    <Svg width={32} height={32} fill="none">
      <G clipPath="url(#a)">
        <Path
          fill={theme.colorIcon1}
          d="M25.868 5.488H6.11v17.958h19.758V5.488Z"
        />
        <Path
          fill={theme.tokenLogoBg}
          fillRule="evenodd"
          d="M31.99 15.998c0 8.825-7.16 15.979-15.99 15.979S.01 24.823.01 15.998 7.17.02 16 .02s15.99 7.153 15.99 15.978Zm-20.521 6.359H8.366c-.652 0-.974 0-1.17-.126a.788.788 0 0 1-.358-.616c-.012-.231.15-.514.471-1.08L14.971 7.04c.326-.573.491-.86.7-.965a.791.791 0 0 1 .714 0c.208.106.373.392.7.965l1.575 2.748.008.014c.352.615.53.927.608 1.254a2.33 2.33 0 0 1 0 1.091c-.078.33-.255.644-.613 1.268l-4.024 7.11-.01.018c-.355.62-.535.934-.784 1.171-.27.26-.597.448-.954.554-.326.09-.691.09-1.422.09Zm7.836 0h4.447c.656 0 .986 0 1.182-.13a.785.785 0 0 0 .358-.62c.011-.224-.147-.495-.455-1.028l-.032-.055-2.228-3.808-.025-.043c-.313-.528-.471-.795-.674-.899a.782.782 0 0 0-.71 0c-.205.106-.37.385-.696.946l-2.22 3.808-.007.013c-.325.56-.487.84-.476 1.07a.795.795 0 0 0 .358.62c.193.126.522.126 1.178.126Z"
          clipRule="evenodd"
        />
      </G>
      <Circle
        cx={26}
        cy={26}
        r={5.5}
        fill={theme.blueDark}
        stroke={theme.colorBg2}
      />
      <Path
        fill={theme.colorIcon1}
        d="m23.395 27.921 1.767-1.767 1.083 1.084a.33.33 0 0 0 .484-.014l2.39-2.69a.334.334 0 0 0-.497-.443l-2.13 2.393-1.097-1.096a.332.332 0 0 0-.47 0l-2.03 2.033c-.13.13-.13.34 0 .47l.03.03c.13.13.344.13.47 0Z"
      />
      <Defs>
        <ClipPath id="a">
          <Path fill={theme.colorIcon1} d="M0 0h32v32H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default StakeLogoSmallSVG
