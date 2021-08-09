import React, {useState} from 'react';
import {Appearance, Text} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';

type Props = {
  text: string;
  multiline?: boolean;
  color?: string;
};

export default function TextLabel(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );

  let THEME = commonViewModel.theme;
  return (
    <Text
      numberOfLines={props.multiline ? undefined : 1}
      style={[
        {
          textAlign: props.multiline ? 'center' : 'left',
          color: props.color || THEME.textOnBg,
          fontSize: 13,
          fontFamily: 'Inter-Regular',
        },
      ]}>
      {props.text}
    </Text>
  );
}
