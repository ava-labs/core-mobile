import React, {useState} from 'react';
import {Appearance, Text} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import {COLORS, COLORS_NIGHT} from '../resources/Constants';

type Props = {
  text: string;
  size?: number;
  textAlign?: 'center' | 'right';
  type?: 'import' | 'export';
};

export default function TextAmount(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode] = useState(commonViewModel.isDarkMode);

  let THEME = isDarkMode ? COLORS_NIGHT : COLORS;
  let color = THEME.primaryColor;
  if (props.type) {
    switch (props.type) {
      case 'import':
        color = THEME.incoming;
        break;
      case 'export':
        color = THEME.outgoing;
        break;
    }
  }
  return (
    <Text
      style={[
        {
          color: color,
          fontSize: props.size ? props.size : 16,
          fontFamily: 'Inter-Regular',
          textAlign: props.textAlign,
        },
      ]}>
      {props.text}
    </Text>
  );
}
