import React, {RefObject, useEffect, useRef, useState} from 'react';
import {Appearance, InteractionManager, TextInput, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import TextLabel from 'components/TextLabel';
import AvaButton from './AvaButton';
import {Opacity50} from 'resources/Constants';
import ClearInputSVG from 'components/svg/ClearInputSVG';
import {Space} from 'components/Space';
import AvaText from './AvaText';
import CheckmarkSVG from 'components/svg/CheckmarkSVG';
import {Popable} from 'react-native-popable';

type Props = {
  onChangeText?: (text: string) => void;
  editable?: boolean;
  multiline?: boolean;
  minHeight?: number;
  onSubmit?: () => void;
  onMax?: () => void;
  onConfirm?: (text: string) => void;
  placeholder?: string;
  // Shows label above input
  label?: string;
  // Shows helper text under input
  helperText?: string | React.ReactNode;
  // Shows error message and error color border
  errorText?: string;
  // Private - Hides input, shows toggle button to show input, neon color border. Will disable multiline.
  mode?:
    | 'default'
    | 'private'
    | 'amount'
    | 'confirmEntry'
    | 'percentage'
    | 'currency';
  // Set keyboard type (numeric, text)
  keyboardType?: 'numeric';
  // shows popover info if provided
  popOverInfoText?: string | React.ReactElement;
  autoFocus?: boolean;
  text?: string;
  currency?: string;
};

export default function InputText(props: Props | Readonly<Props>) {
  const context = useApplicationContext();
  const [text, setText] = useState(props.text ?? '');
  const [showInput, setShowInput] = useState(false);
  const [focused, setFocused] = useState(false);
  const [toggleShowText, setToggleShowText] = useState('Show');
  const [mode] = useState(props.mode ?? 'default');
  const textInputRef = useRef() as RefObject<TextInput>;
  const [initText, setInitText] = useState(props.text);

  useEffect(() => {
    if (props.text !== undefined && isNaN(Number(props.text))) {
      return;
    }
    //detects change in param, without it, changing param won't trigger redraw
    if (initText !== props.text) {
      setInitText(props.text);
      setText(props.text ?? '');
    }
  });

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
    return (
      <View
        style={[
          {
            position: 'absolute',
            end: 8,
            top: 2,
          },
        ]}>
        <AvaButton.Icon onPress={onClear}>
          <ClearInputSVG color={theme.colorText2} size={14} />
        </AvaButton.Icon>
      </View>
    );
  };

  const Percent = () => {
    return (
      <View
        style={[
          {
            position: 'absolute',
            justifyContent: 'center',
            end: 16,
          },
        ]}>
        <AvaText.Heading3>%</AvaText.Heading3>
      </View>
    );
  };

  const Currency = ({currency}: {currency?: string}) => {
    return (
      <View
        style={[
          {
            position: 'absolute',
            justifyContent: 'center',
            end: 16,
          },
        ]}>
        <AvaText.Heading3>{currency}</AvaText.Heading3>
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
      <View style={{alignSelf: 'baseline'}}>
        {props.popOverInfoText ? (
          <Popable
            content={props.popOverInfoText}
            position={'right'}
            style={{minWidth: 200}}
            backgroundColor={context.theme.colorBg3}>
            <TextLabel multiline textAlign="left" text={props.label || ''} />
          </Popable>
        ) : (
          <TextLabel multiline textAlign="left" text={props.label || ''} />
        )}
        <View style={[{height: 8}]} />
      </View>
    );
  };

  const HelperText = () => {
    return (
      <>
        <Space y={5} />
        {!!props.helperText && typeof props.helperText === 'string' ? (
          <AvaText.Body2 textStyle={{textAlign: 'left'}}>
            {props.helperText}
          </AvaText.Body2>
        ) : (
          <View>{props.helperText}</View>
        )}
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
      text = text.replace(/[^.\d]/g, '');
      text = text.replace(/^0+/g, '0');
      let numOfDots = 0;
      text = text.replace(/\./g, substring => {
        if (numOfDots === 0) {
          numOfDots++;
          return substring;
        } else {
          return '';
        }
      });
    }
    setText(text);
    props.onChangeText?.(text);
  };

  return (
    <View style={{margin: 12}}>
      {props.label && <Label />}
      <View
        style={[
          {
            justifyContent: 'center',
          },
        ]}>
        <TextInput
          keyboardAppearance={Appearance.getColorScheme() || 'default'}
          ref={textInputRef}
          autoCapitalize="none"
          placeholder={props.placeholder}
          placeholderTextColor={theme.colorText2}
          blurOnSubmit={true}
          secureTextEntry={mode === 'private' && !showInput}
          onSubmitEditing={onSubmit}
          returnKeyType={props.onSubmit && 'go'}
          enablesReturnKeyAutomatically={true}
          editable={props.editable !== false}
          keyboardType={props.keyboardType}
          multiline={
            props.multiline && mode === 'default' ? props.multiline : false
          }
          style={[
            {
              minHeight: props.minHeight,
              flexGrow: 0,
              color: theme.colorText1,
              fontSize: 16,
              borderWidth: 1,
              textAlignVertical: props.multiline ? 'top' : undefined,
              borderColor: props.errorText
                ? theme.txtError
                : focused
                ? theme.colorText2
                : theme.colorBg3,
              backgroundColor:
                text.length > 0
                  ? theme.transparent
                  : focused
                  ? theme.transparent
                  : theme.colorBg3 + Opacity50,
              borderRadius: 8,
              paddingStart: 16,
              paddingEnd:
                mode === 'private'
                  ? 80
                  : mode === 'amount' && !props.onMax
                  ? 16
                  : mode === 'currency'
                  ? 50
                  : 46,
              paddingTop: 12,
              paddingBottom: 12,
              fontFamily: 'Inter-Regular',
            },
          ]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          value={text}
        />
        {mode === 'default' && text.length > 0 && <ClearBtn />}
        {mode === 'private' && text.length > 0 && <ShowPassBtn />}
        {mode === 'amount' && props.onMax && <MaxBtn onPress={props.onMax} />}
        {mode === 'confirmEntry' && (
          <ConfirmBtn onPress={() => props.onConfirm?.(text)} />
        )}
        {mode === 'percentage' && <Percent />}
        {mode === 'currency' && <Currency currency={props.currency} />}
      </View>

      {props.helperText && <HelperText />}

      {(props.errorText || false) && <ErrorText />}
    </View>
  );
}

function MaxBtn({onPress}: {onPress?: () => void}) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          end: 0,
        },
      ]}>
      <AvaButton.TextMedium onPress={onPress}>Max</AvaButton.TextMedium>
    </View>
  );
}

function ConfirmBtn({onPress}: {onPress?: () => void}) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          end: 16,
        },
      ]}>
      <AvaButton.Icon onPress={onPress}>
        <CheckmarkSVG />
      </AvaButton.Icon>
    </View>
  );
}
