import React from 'react';
import {View} from 'react-native';

type Props = {
  size: number;
};

export default function Divider(props: Props | Readonly<Props>) {
  return (
    <View
      style={[
        {
          height: props.size,
          width: props.size,
        },
      ]}
    />
  );
}
