import React from 'react';
import Svg, {Rect} from 'react-native-svg';
import {useApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  selected: boolean;
}

function WatchListSVG({selected}: Prop) {
  const context = useApplicationContext();

  const svgColor = selected
    ? context.theme.alternateBackground
    : context.theme.txtDim;
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <Rect
        x="9"
        y="8"
        width="20"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
      <Rect
        x="9"
        y="15"
        width="20"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
      <Rect
        x="9"
        y="22"
        width="20"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
      <Rect
        x="3"
        y="8"
        width="2"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
      <Rect
        x="3"
        y="15"
        width="2"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
      <Rect
        x="3"
        y="22"
        width="2"
        height="2"
        rx="1"
        fill={svgColor}
        stroke={svgColor}
      />
    </Svg>
  );
}

export default WatchListSVG;
