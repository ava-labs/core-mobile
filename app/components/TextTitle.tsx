import React, {useState} from 'react';
import {Appearance, ColorValue, Text} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import {COLORS, COLORS_NIGHT} from '../resources/Constants';

type Props = {
  text: string;
  size?: number;
  bold?: boolean;
  color?: ColorValue;
  lineHeight?: number;
  textAlign?: 'center' | 'right';
};

export default function TextTitle(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode] = useState(commonViewModel.isDarkMode);

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS;
  return (
    <Text
      style={[
        {
          lineHeight: props.lineHeight || undefined,
          color: props.color || THEME.primaryColor,
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
