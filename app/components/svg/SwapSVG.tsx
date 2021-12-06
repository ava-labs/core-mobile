import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  selected: boolean;
}

function SwapSVG({selected}: Prop) {
  const context = useApplicationContext();

  const svgColor = selected
    ? context.theme.accentColor
    : context.theme.onBgSearch;
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <Path
        d="M24.579 20.9689H22.4602V7.60938C22.4602 7.22073 22.1551 6.90625 21.7665 6.90625H18.9539C18.5653 6.90625 18.2508 7.22073 18.2508 7.60938V20.9689H16.1414C15.5623 20.9689 15.2322 21.6322 15.579 22.0936L19.7979 27.7187C20.0786 28.094 20.6423 28.0934 20.9226 27.7187L25.1414 22.0937C25.4878 21.6327 25.1585 20.9689 24.579 20.9689Z"
        fill={svgColor}
      />
      <Path
        d="M16.7038 9.89084L12.485 4.26575C12.22 3.91142 11.6253 3.91142 11.3603 4.26575L7.1415 9.89084C6.79468 10.3523 7.12486 11.0156 7.70386 11.0156H9.81328V24.3751C9.81328 24.7637 10.1278 25.0782 10.5164 25.0782H13.3289C13.7175 25.0782 14.0227 24.7637 14.0227 24.3751V11.0156H16.1414C16.7209 11.0156 17.0503 10.3518 16.7038 9.89084Z"
        fill={svgColor}
      />
    </Svg>
  );
}

export default SwapSVG;
