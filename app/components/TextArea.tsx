import React, {useContext, useEffect, useRef, useState} from 'react';
import {InteractionManager, StyleSheet, TextInput, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from './AvaButton';
import AvaText from './AvaText';

type Props = {
  btnPrimaryText: string;
  btnSecondaryText: string;
  onBtnPrimary: (text: string) => void;
  onBtnSecondary: () => void;
  onChangeText: (text: string) => void;
  heading?: string;
  errorMessage?: string;
  autoFocus?: boolean;
  autoCorrect?: boolean;
};

export default function TextArea(props: Props | Readonly<Props>): JSX.Element {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  const [enteredText, setEnteredText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    props.errorMessage,
  );

  const [primaryDisabled, setPrimaryDisabled] = useState(true);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (props.autoFocus) {
      InteractionManager.runAfterInteractions(() => {
        textInputRef.current?.focus();
      });
    }
  }, [props.autoFocus, textInputRef]);

  useEffect(() => {
    setErrorMessage(props.errorMessage);
  }, [props.errorMessage]);

  useEffect(() => {
    if (enteredText) {
      setPrimaryDisabled(false);
    } else {
      setPrimaryDisabled(true);
    }
  }, [enteredText]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colorBg2,
        },
      ]}>
      <View
        style={[
          {
            display: 'flex',
            flexDirection: 'column',
            padding: 16,
            height: 160,
          },
        ]}>
        {props.heading && (
          <AvaText.Heading2 textStyle={{marginBottom: 16}}>
            Recovery phrase
          </AvaText.Heading2>
        )}
        <TextInput
          ref={textInputRef}
          autoCorrect={props?.autoCorrect}
          placeholder={'Enter your recovery phrase'}
          placeholderTextColor={theme.colorDisabled}
          multiline={true}
          value={enteredText}
          onChangeText={text => {
            setEnteredText(text);
            props.onChangeText(text);
          }}
          style={[
            {
              flexShrink: 1,
              textAlignVertical: 'top',
              color: theme.colorText1,
              fontSize: 16,
              padding: 0,
              lineHeight: 24,
              fontFamily: 'Inter-Regular',
            },
          ]}
        />
        {errorMessage && (
          <AvaText.Body3 textStyle={{color: theme.colorError, marginTop: 4}}>
            {errorMessage}
          </AvaText.Body3>
        )}
      </View>

      <View style={[styles.buttonContainer, {backgroundColor: theme.colorBg3}]}>
        <AvaButton.TextLarge onPress={props.onBtnSecondary}>
          {props.btnSecondaryText}
        </AvaButton.TextLarge>
        <AvaButton.PrimaryMedium
          disabled={primaryDisabled}
          onPress={() => props.onBtnPrimary(enteredText)}>
          {props.btnPrimaryText}
        </AvaButton.PrimaryMedium>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
  },
  buttonContainer: {
    margin: 0,
    padding: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
