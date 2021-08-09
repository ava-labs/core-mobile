import React, {useState} from 'react';
import {Appearance, Text} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import {COLORS, COLORS_NIGHT} from '../resources/Constants';

type Props = {
  text: string;
  disabled?: boolean;
  size?: 'large' | 'medium' | 'small';
};

export default function TextButton(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode] = useState(commonViewModel.isDarkMode);

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS;
  const size = props.size || 'large';
  let fontSize = 18;
  switch (size) {
    case 'large':
      fontSize = 18;
      break;
    case 'medium':
      fontSize = 14;
      break;
    case 'small':
      fontSize = 12;
      break;
  }
  return (
    <Text
      style={[
        {
          color: props.disabled
            ? THEME.primaryColorLight
            : THEME.buttonPrimaryText,
          fontSize: fontSize,
          fontWeight: '600',
          fontFamily: 'Inter-Regular',
          textAlign: 'center',
        },
      ]}>
      {props.text}
    </Text>
  );
}
