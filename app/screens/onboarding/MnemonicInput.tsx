import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import InputText from 'components/InputText';
import {ApplicationContext} from 'contexts/applicationContext';

type Props = {
  keyNum: number;
  text: string;
  editable: boolean;
  onChangeText?: (text: string) => void;
};

export default function MnemonicInput(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  return (
    <View style={styles.horizontalLayout}>
      <TextTitle
        text={(props.keyNum + 1).toString()}
        size={16}
        color={theme.primaryColorLight}
      />
      <InputText
        value={props.text}
        style={styles.input}
        textSize={16}
        editable={props.editable}
        onChangeText={props.onChangeText}
      />
    </View>
  );
}

const styles: any = StyleSheet.create({
  superscript: {
    position: 'absolute',
    end: 14,
    top: 14,
  },
  horizontalLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  input: {
    margin: 0,
    marginLeft: -4,
    flexGrow: 1,
    borderWidth: 0,
    fontWeight: '600',
  },
});
