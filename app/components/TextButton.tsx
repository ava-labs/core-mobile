import React, {useContext} from 'react';
import {Text} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  text: string;
  disabled?: boolean;
  size?: 'large' | 'medium' | 'small';
};

export default function TextButton(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
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
            ? theme.btnPrimaryTxtDisabled
            : theme.btnPrimaryTxt,
          fontSize: fontSize,
          fontWeight: '700',
          fontFamily: 'Inter-Regular',
          textAlign: 'center',
        },
      ]}>
      {props.text}
    </Text>
  );
}
