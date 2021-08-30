import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import {ApplicationContext} from 'contexts/ApplicationContext';
import Divider from 'components/Divider';

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
      <View style={[{width: 20}]}>
        <TextTitle
          text={(props.keyNum + 1).toString()}
          size={16}
          color={theme.primaryColorLight}
        />
      </View>
      <Divider size={4} />
      <TextTitle text={props.text} size={16} />
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
    height: 32,
  },
  input: {
    margin: 0,
    marginLeft: -4,
    flexGrow: 1,
    borderWidth: 0,
    fontWeight: '600',
  },
});
