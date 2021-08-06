import React, {useState} from 'react';
import {Appearance, StyleSheet, View} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import TextTitle from 'components/TextTitle';
import {COLORS, COLORS_NIGHT} from 'resources/Constants';

type Props = {
  title: string;
  balance: string;
};

export default function AssetsItem(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode] = useState(commonViewModel.isDarkMode);

  let THEME = isDarkMode ? COLORS_NIGHT : COLORS;

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: THEME.bgLight,
          borderBottomWidth: 1,
        },
      ]}>
      <TextTitle text={props.title} size={18} />
      <TextTitle text={props.balance} size={18} />
    </View>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
});
