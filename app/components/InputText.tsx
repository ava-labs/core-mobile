import React, {RefObject, useContext, useEffect, useRef, useState} from 'react';
import {InteractionManager, TextInput, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import TextLabel from 'components/TextLabel';
import ImgButtonAva from 'components/ImgButtonAva';
import AvaButton from './AvaButton';

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
  // Set keyboard type (numeric, text)
  keyboardType?: 'numeric';
  autoFocus?: boolean;
};

export default function InputText(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const [text, setText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [focused, setFocused] = useState(false);
  const [toggleShowText, setToggleShowText] = useState('Show');
  const textInputRef = useRef() as RefObject<TextInput>;

  useEffect(() => {
    setToggleShowText(showInput ? 'Hide' : 'Show');
  }, [showInput]);

  useEffect(() => {
    if (props.autoFocus) {
      InteractionManager.runAfterInteractions(() => {
        textInputRef.current?.focus();
      });
    }
  }, [props.autoFocus, textInputRef]);

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
            end: 0,
          },
        ]}>
        <AvaButton.TextMedium onPress={onToggleShowInput}>
          {toggleShowText}
        </AvaButton.TextMedium>
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
          color={theme.txtError}
          text={props.errorText || ''}
        />
      </>
    );
  };

  const onChangeText = (text: string): void => {
    if (props.keyboardType === 'numeric') {
      text = text.replace(',', '.');
      text = text.replace(/(?<=\..*)\./g, '');
    }
    setText(text);
    props.onChangeText?.(text);
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
          ref={textInputRef}
          autoCapitalize="none"
          placeholder={props.placeholder}
          blurOnSubmit={true}
          secureTextEntry={props.privateMode && !showInput}
          onSubmitEditing={onSubmit}
          returnKeyType={props.onSubmit && 'go'}
          enablesReturnKeyAutomatically={true}
          editable={props.editable !== false}
          keyboardType={props.keyboardType}
          multiline={
            props.multiline && !props.privateMode ? props.multiline : false
          }
          style={[
            {
              minHeight: props.minHeight,
              flexGrow: 0,
              color: theme.inputTxt,
              fontSize: 16,
              borderWidth: 1,
              textAlignVertical: props.multiline ? 'top' : undefined,
              borderColor: props.errorText
                ? theme.txtError
                : focused
                ? theme.inputBorderFocused
                : props.privateMode
                ? theme.inputBorderFocused
                : theme.inputBorder,
              backgroundColor: focused ? theme.inputBgFocused : theme.inputBg,
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
          onChangeText={onChangeText}
          value={props.value}
        />
        {!props.privateMode && text.length > 0 && <ClearBtn />}
        {props.privateMode && text.length > 0 && <ShowPassBtn />}
      </View>

      {props.helperText && <HelperText />}

      {(props.errorText || false) && <ErrorText />}
    </View>
  );
}
