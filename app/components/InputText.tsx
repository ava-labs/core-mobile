import React, {useContext} from 'react';
import {StyleProp, TextInput, TextStyle} from 'react-native';
import {ApplicationContext} from 'contexts/applicationContext';

type Props = {
  value: string;
  onChangeText?: (text: string) => void;
  textSize?: number;
  editable?: boolean;
  multiline?: boolean;
  style?: StyleProp<TextStyle>;
  onSubmit?: () => void;
  placeholder?: string;
};

export default function InputText(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);

  const onSubmit = (): void => {
    props.onSubmit?.();
  };

  const theme = context.theme;
  return (
    <TextInput
      placeholder={props.placeholder}
      blurOnSubmit={true}
      onSubmitEditing={onSubmit}
      returnKeyType={props.onSubmit && 'go'}
      enablesReturnKeyAutomatically={true}
      editable={props.editable !== false}
      multiline={props.multiline ? props.multiline : false}
      style={[
        {
          color: theme.primaryColor,
          fontSize: props.textSize ? props.textSize : 18,
          borderWidth: 1,
          borderColor: theme.primaryColorLight,
          borderRadius: 4,
          margin: 12,
          padding: 8,
          fontFamily: 'Inter-Regular',
        },
        props.style,
      ]}
      onChangeText={props.onChangeText}
      value={props.value}
    />
  );
}
