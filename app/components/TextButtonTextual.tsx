import React, {useContext} from 'react';
import {Text} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  text: string;
  disabled?: boolean;
  color?: string;
  centered?: boolean
};

export default function TextButtonTextual({
  text,
  disabled = false,
  color,
  centered = true,
}: Props) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  function getTextColor() {
    if (color) {
      return color;
    }

    return disabled ? theme.btnTextTxtDisabled : theme.btnTextTxt;
  }
  return (
    <Text
      style={{
        color: getTextColor(),
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Inter-Regular',
        textAlign: centered ? 'center' : 'auto',
      }}>
      {text}
    </Text>
  );
}
