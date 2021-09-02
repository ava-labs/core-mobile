import React, {useContext} from 'react';
import Svg, {Circle, G, Path} from 'react-native-svg';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  color?: string;
  circleColor?: string;
  hideCircle?: boolean;
}

function AddSVG({color, circleColor, hideCircle = false}: Prop) {
  const context = useContext(ApplicationContext);

  const svgColor = color ?? context.theme.buttonIcon;
  const strokeColor = circleColor ?? context.theme.buttonIconOutline;
  return (
    <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {hideCircle || <Circle cx="22" cy="22" r="21.5" stroke={strokeColor} />}
      <G clip-path="url(#clip0)">
        <Path
          d="M32.7999 20.8H23.2001V11.1999C23.2001 10.5377 22.6624 10 21.9999 10C21.3377 10 20.8 10.5377 20.8 11.1999V20.8H11.1999C10.5377 20.8 10 21.3377 10 21.9999C10 22.6624 10.5377 23.2001 11.1999 23.2001H20.8V32.7999C20.8 33.4624 21.3377 34.0001 21.9999 34.0001C22.6624 34.0001 23.2001 33.4624 23.2001 32.7999V23.2001H32.7999C33.4624 23.2001 34.0001 22.6624 34.0001 21.9999C34.0001 21.3377 33.4624 20.8 32.7999 20.8Z"
          fill={svgColor}
        />
      </G>
    </Svg>
  );
}

export default AddSVG;
