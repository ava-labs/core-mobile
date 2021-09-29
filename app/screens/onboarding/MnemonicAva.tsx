import React, {useContext} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';

type InputProps = {
  keyNum: number;
  text: string;
  onChangeText?: (text: string) => void;
};

function MnemonicInput(props: InputProps | Readonly<InputProps>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  return (
    <View style={styles.horizontalLayout}>
      <View style={[{width: 20}]}>
        <TextTitle
          text={(props.keyNum + 1).toString()}
          size={16}
          color={theme.txtDim}
        />
      </View>
      <Space y={4} />
      <TextInput
        autoCapitalize="none"
        enablesReturnKeyAutomatically={true}
        style={[
          {
            color: theme.txtOnBgApp,
            flex: 1,
            fontSize: 16,
            borderWidth: 1,
            borderColor: theme.btnIconBorder,
            padding: 4,
            borderRadius: 4,
            fontFamily: 'Inter-Regular',
          },
        ]}
        onChangeText={props.onChangeText}
        value={props.text}
      />
    </View>
  );
}

type TextProps = {
  keyNum: number;
  text: string;
};

function MnemonicText(props: TextProps | Readonly<TextProps>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  return (
    <View style={styles.horizontalLayout}>
      <View style={[{width: 20}]}>
        <TextTitle
          text={(props.keyNum + 1).toString()}
          size={16}
          color={theme.txtDim}
        />
      </View>
      <Space y={4} />
      <TextTitle text={props.text} size={16} />
    </View>
  );
}

const styles: any = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    height: 32,
  },
});

const MnemonicAva = {
  Input: MnemonicInput,
  Text: MnemonicText,
};

export default MnemonicAva;
