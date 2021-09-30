import React, {useContext} from 'react';
import Svg, {Circle, Rect} from 'react-native-svg';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  color?: string;
  circleColor?: string;
}

function MenuSVG({color, circleColor}: Prop) {
  const context = useContext(ApplicationContext);

  const iconColor = color ?? context.theme.btnIconIcon;
  const borderColor = circleColor ?? context.theme.btnIconBorder;
  return (
    <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <Circle cx="22" cy="22" r="21.5" stroke={borderColor} />
      <Rect
        x="10"
        y="20.5"
        width="24"
        height="2.5"
        rx="1.25"
        fill={iconColor}
      />
      <Rect x="10" y="12" width="24" height="2.5" rx="1.25" fill={iconColor} />
      <Rect x="10" y="29" width="24" height="2.5" rx="1.25" fill={iconColor} />
    </Svg>
  );
}

export default MenuSVG;
