import React, {useContext} from 'react';
import {ColorValue, Text} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  text: string;
  size?: number;
  bold?: boolean;
  color?: ColorValue;
  lineHeight?: number;
  textAlign?: 'center' | 'right';
};

export default function TextTitle(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  return (
    <Text
      style={[
        {
          lineHeight: props.lineHeight || undefined,
          color: props.color || theme.primaryColor,
          fontSize: props.size ? props.size : 26,
          fontFamily: 'Inter-Regular',
          fontWeight: props.bold ? 'bold' : 'normal',
          textAlign: props.textAlign,
        },
      ]}>
      {props.text}
    </Text>
  );
}
