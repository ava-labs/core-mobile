import React, {useContext} from 'react';
import {ColorValue, Text} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  text: string;
  size?: number;
  bold?: boolean;
  color?: ColorValue;
  lineHeight?: number;
  textAlign?: 'center' | 'right';
};

export default function TextTitle(props: Props | Readonly<Props>) {
  const context = useApplicationContext();
  const theme = context.theme;
  return (
    <Text
      style={[
        {
          lineHeight: props.lineHeight || undefined,
          color: props.color || theme.txtOnBgApp,
          fontSize: props.size ? props.size : 26,
          fontFamily: props.bold ? 'Inter-Bold' : 'Inter-Regular',
          textAlign: props.textAlign,
        },
      ]}>
      {props.text}
    </Text>
  );
}
