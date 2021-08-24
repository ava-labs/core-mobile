import React, {useContext} from 'react';
import Svg, {Circle, Rect} from 'react-native-svg';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  color?: string;
  circleColor?: string;
}

function AnalyticsSVG({color, circleColor}: Prop) {
  const context = useContext(ApplicationContext);
  const isDarkMode = context.isDarkMode;
  const svgColor = color ?? isDarkMode ? '#FFF' : '#1A1A1C';
  const strokeColor = circleColor ?? isDarkMode ? '#3A3A3C' : '#E8E8EB';
  return (
    <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <Circle cx="22" cy="22" r="21.5" stroke={strokeColor} />
      <Rect x="11" y="28" width="2.5" height="6" rx="1.25" fill={svgColor} />
      <Rect x="17.5" y="18" width="2.5" height="16" rx="1.25" fill={svgColor} />
      <Rect x="24" y="10" width="2.5" height="24" rx="1.25" fill={svgColor} />
      <Rect x="30.5" y="22" width="2.5" height="12" rx="1.25" fill={svgColor} />
    </Svg>
  );
}

export default AnalyticsSVG;
