import React from 'react';
import {Image} from 'react-native';

type Props = {
  filled?: boolean;
  size?: number;
  margin?: number;
};

const getIcon = (isFilled: boolean) => {
  return isFilled
    ? require('assets/icons/dot_filled.png')
    : require('assets/icons/dot.png');
};

export default function Dot(props: Props | Readonly<Props>) {
  const icon = getIcon(props.filled || false);
  const iconSize = props.size || 20;
  const iconMargin = props.margin || 0;

  return (
    <Image
      source={icon}
      width={iconSize}
      height={iconSize}
      style={[
        {
          width: iconSize,
          height: iconSize,
          margin: iconMargin,
        },
      ]}
    />
  );
}
