import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import {ApplicationContext} from 'contexts/applicationContext';

type Props = {
  title: string;
  balance: string;
};

export default function AssetsItem(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: theme.bgLight,
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
