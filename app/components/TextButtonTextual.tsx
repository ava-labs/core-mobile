import React, {useState} from 'react';
import {Appearance, Text} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import {COLORS, COLORS_NIGHT} from '../resources/Constants';

type Props = {
  text: string;
  disabled?: boolean;
};

export default function TextButtonTextual(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode] = useState(commonViewModel.isDarkMode);

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS;
  return (
    <Text
      style={[
        {
          color: props.disabled
            ? THEME.buttonPrimaryText
            : THEME.primaryColorLight,
          fontSize: 14,
          fontWeight: '600',
          fontFamily: 'Inter-Regular',
          textAlign: 'center',
        },
      ]}>
      {props.text}
    </Text>
  );
}
