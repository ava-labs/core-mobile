import React, {useState} from 'react';
import {Appearance, Text} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import {COLORS, COLORS_NIGHT} from '../resources/Constants';

type Props = {
  text: string;
  multiline?: boolean;
};

export default function TextLabel(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode] = useState(commonViewModel.isDarkMode);

  let THEME = isDarkMode ? COLORS_NIGHT : COLORS;
  return (
    <Text
      numberOfLines={props.multiline ? undefined : 1}
      style={[
        {
          textAlign: props.multiline ? 'center' : 'left',
          color: THEME.textOnBg,
          fontSize: 13,
          fontFamily: 'Inter-Regular',
        },
      ]}>
      {props.text}
    </Text>
  );
}
