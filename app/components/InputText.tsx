import React, {useContext, useEffect, useState} from 'react';
import {TextInput, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import TextLabel from 'components/TextLabel';
import ImgButtonAva from 'components/ImgButtonAva';
import ButtonAvaTextual from 'components/ButtonAvaTextual';

type Props = {
  value: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  multiline?: boolean;
  minHeight?: number;
  onSubmit?: () => void;
  placeholder?: string;
  // Shows label above input
  label?: string;
  // Shows helper text under input
  helperText?: string;
  // Shows error message and error color border
  errorText?: string;
  // Hides input, shows toggle button to show input, neon color border. Will disable multiline.
  privateMode?: boolean;
};

export default function InputText(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const [text, setText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [focused, setFocused] = useState(false);
  const [toggleShowText, setToggleShowText] = useState('Show');

  useEffect(() => {
    setToggleShowText(showInput ? 'Hide' : 'Show');
  }, [showInput]);

  const onSubmit = (): void => {
    props.onSubmit?.();
  };
  const onClear = (): void => {
    setText('');
    props.onChangeText?.('');
  };
  const onToggleShowInput = (): void => {
    setShowInput(!showInput);
  };

  const theme = context.theme;

  const ClearBtn = () => {
    const clearIcon = require('assets/icons/input_clear.png');
    return (
      <View
        style={[
          {
            position: 'absolute',
            end: 6,
            top: 10,
          },
        ]}>
        <ImgButtonAva
          width={14}
          height={14}
          src={clearIcon}
          onPress={onClear}
        />
      </View>
    );
  };

  const ShowPassBtn = () => {
    return (
      <View
        style={[
          {
            position: 'absolute',
            end: -16,
          },
        ]}>
        <ButtonAvaTextual text={toggleShowText} onPress={onToggleShowInput} />
      </View>
    );
  };

  const Label = () => {
    return (
      <>
        <TextLabel multiline textAlign="left" text={props.label || ''} />
        <View style={[{height: 8}]} />
      </>
    );
  };

  const HelperText = () => {
    return (
      <>
        <View style={[{height: 4}]} />
        <TextLabel textAlign="left" text={props.helperText || ''} />
      </>
    );
  };

  const ErrorText = () => {
    return (
      <>
        <View style={[{height: 4}]} />
        <TextLabel
          textAlign="left"
          color={theme.error}
          text={props.errorText || ''}
        />
      </>
    );
  };

  return (
    <View
      style={[
        {
          margin: 12,
          flexDirection: 'column',
        },
      ]}>
      {props.label && <Label />}

      <View
        style={[
          {
            flexDirection: 'column',
            justifyContent: 'center',
          },
        ]}>
        <TextInput
          autoCapitalize="none"
          placeholder={props.placeholder}
          blurOnSubmit={true}
          secureTextEntry={props.privateMode && !showInput}
          onSubmitEditing={onSubmit}
          returnKeyType={props.onSubmit && 'go'}
          enablesReturnKeyAutomatically={true}
          editable={props.editable !== false}
          multiline={
            props.multiline && !props.privateMode ? props.multiline : false
          }
          style={[
            {
              minHeight: props.minHeight,
              flexGrow: 0,
              color: theme.primaryColor,
              fontSize: 16,
              borderWidth: 1,
              textAlignVertical: props.multiline ? 'top' : undefined,
              borderColor: props.errorText
                ? theme.error
                : focused
                ? theme.textFieldFocused
                : props.privateMode
                ? theme.textFieldPrivate
                : theme.textFieldBorder,
              backgroundColor: theme.textFieldBg,
              borderRadius: 8,
              paddingStart: 16,
              paddingEnd: !props.privateMode ? 46 : 80,
              paddingTop: 12,
              paddingBottom: 12,
              fontFamily: 'Inter-Regular',
            },
          ]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={text1 => {
            setText(text1);
            props.onChangeText?.(text1);
          }}
          value={props.value}
        />
        {!props.privateMode && text.length > 0 && <ClearBtn />}
        {props.privateMode && text.length > 0 && <ShowPassBtn />}
      </View>

      {props.helperText && <HelperText />}

      {props.errorText && <ErrorText />}
    </View>
  );
}
