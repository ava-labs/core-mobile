import React, {useContext} from 'react';
import Svg, {Rect} from 'react-native-svg';
import {useApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  selected: boolean;
}

function MoreSVG({selected}: Prop) {
  const context = useApplicationContext();

  const svgColor = selected
    ? context.theme.accentColor
    : context.theme.onBgSearch;
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <Rect
        x="5"
        y="5"
        width="9.07692"
        height="9.07692"
        rx="3"
        fill={svgColor}
        stroke={svgColor}
        strokeWidth="2"
      />
      <Rect
        x="5"
        y="17.9231"
        width="9.07692"
        height="9.07692"
        rx="3"
        fill={svgColor}
        stroke={svgColor}
        strokeWidth="2"
      />
      <Rect
        x="17.9231"
        y="5"
        width="9.07692"
        height="9.07692"
        rx="3"
        fill={svgColor}
        stroke={svgColor}
        strokeWidth="2"
      />
      <Rect
        x="17.9231"
        y="17.9231"
        width="9.07692"
        height="9.07692"
        rx="3"
        fill={svgColor}
        stroke={svgColor}
        strokeWidth="2"
      />
    </Svg>
  );
}

export default MoreSVG;
