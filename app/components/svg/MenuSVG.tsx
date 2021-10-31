import React, {useContext} from 'react';
import Svg, {Rect} from 'react-native-svg';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  color?: string;
}

function MenuSVG({color}: Prop) {
  const context = useContext(ApplicationContext);

  const iconColor = color ?? context.theme.btnIconIcon;
  return (
    <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
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
