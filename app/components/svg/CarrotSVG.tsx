import React, {useContext} from 'react';
import Svg, {Path} from 'react-native-svg';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {View} from 'react-native';

interface Prop {
  color?: string;
  size?: number;
  direction?: 'up' | 'down' | 'left'; //default is `right`
}

function CarrotSVG({color, size = 16, direction}: Prop) {
  const context = useContext(ApplicationContext);

  function getDegrees() {
    let degrees = 0;
    switch (direction) {
      case 'up':
        degrees = -90;
        break;
      case 'down':
        degrees = 90;
        break;
      case 'left':
        degrees = 180;
        break;
    }

    return `${degrees}deg`;
  }

  const Carrot = () => (
    <Svg fill="none" height={size} viewBox="0 0 9 16" width="9">
      <Path
        clipRule="evenodd"
        d="M1.36896 0.241121C1.29602 0.166943 1.20828 0.106157 1.11103 0.064947C1.01378 0.0237366 0.909128 0.00107091 0.803421 4.06494e-05C0.697713 -0.00098961 0.593062 0.0175551 0.494754 0.0567049C0.396446 0.0958547 0.306594 0.153549 0.232599 0.226698C0.157546 0.299846 0.0983499 0.386388 0.058181 0.482202C0.018012 0.578016 -0.00101537 0.680012 4.17075e-05 0.784068C0.00109879 0.887094 0.0243545 0.989089 0.0666376 1.08387C0.109978 1.17763 0.171288 1.26314 0.248455 1.33423L7.08775 8L0.248455 14.6658C0.171288 14.7369 0.109978 14.8224 0.0666376 14.9161C0.0243545 15.0109 0.00109879 15.1129 4.17075e-05 15.2159C-0.00101537 15.32 0.018012 15.422 0.058181 15.5178C0.0983499 15.6136 0.157546 15.7002 0.232599 15.7733C0.306594 15.8465 0.396446 15.9041 0.494754 15.9433C0.593062 15.9814 0.697713 16.001 0.803421 16C0.909128 15.9979 1.01378 15.9763 1.11103 15.9351C1.20828 15.8938 1.29602 15.8331 1.36896 15.7579L8.7685 8.54604C8.91649 8.4018 9 8.20502 9 8C9 7.79498 8.91649 7.59923 8.7685 7.45396L1.36896 0.241121Z"
        fill={color || context.theme.txtDim}
        fillRule="evenodd"
      />
    </Svg>
  );

  /**
   * If user defines a direction, we wrap it in a view and apply the transfor in int since the
   * transform rotation/rotate in the SVG itself behaves differently and not the desired way we want.
   */
  return direction ? (
    <View style={{transform: [{rotate: getDegrees()}]}}>
      <Carrot />
    </View>
  ) : (
    <Carrot />
  );
}

export default CarrotSVG;
