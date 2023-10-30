import * as React from 'react'
import Svg, { Path, Mask, Rect } from 'react-native-svg'

const QRSVG = () => (
  <Svg width={24} height={24} fill="none">
    <Path
      d="M15 20a1 1 0 1 0 0 2h5a2 2 0 0 0 2-2v-5a1 1 0 1 0-2 0v4.357a.643.643 0 0 1-.643.643H15ZM4 15a1 1 0 1 0-2 0v5a2 2 0 0 0 2 2h5a1 1 0 1 0 0-2H4.643A.643.643 0 0 1 4 19.357V15ZM15 4a1 1 0 1 1 0-2h5a2 2 0 0 1 2 2v5a1 1 0 1 1-2 0V4.643A.643.643 0 0 0 19.357 4H15ZM9 4a1 1 0 0 0 0-2H4a2 2 0 0 0-2 2v5a1 1 0 0 0 2 0V4.643C4 4.288 4.288 4 4.643 4H9Z"
      fill="#fff"
    />
    <Mask id="a" fill="#fff">
      <Rect x={6} y={6} width={5} height={5} rx={1} />
    </Mask>
    <Rect
      x={6}
      y={6}
      width={5}
      height={5}
      rx={1}
      stroke="#fff"
      strokeWidth={3.5}
      strokeLinejoin="bevel"
      mask="url(#a)"
    />
    <Mask id="b" fill="#fff">
      <Rect x={13} y={6} width={5} height={5} rx={1} />
    </Mask>
    <Rect
      x={13}
      y={6}
      width={5}
      height={5}
      rx={1}
      stroke="#fff"
      strokeWidth={3.5}
      strokeLinejoin="bevel"
      mask="url(#b)"
    />
    <Mask id="c" fill="#fff">
      <Rect x={13} y={13} width={5} height={5} rx={1} />
    </Mask>
    <Rect
      x={13}
      y={13}
      width={5}
      height={5}
      rx={1}
      stroke="#fff"
      strokeWidth={3.5}
      strokeLinejoin="bevel"
      mask="url(#c)"
    />
    <Mask id="d" fill="#fff">
      <Rect x={6} y={13} width={5} height={5} rx={1} />
    </Mask>
    <Rect
      x={6}
      y={13}
      width={5}
      height={5}
      rx={1}
      stroke="#fff"
      strokeWidth={3.5}
      strokeLinejoin="bevel"
      mask="url(#d)"
    />
  </Svg>
)

export default QRSVG
