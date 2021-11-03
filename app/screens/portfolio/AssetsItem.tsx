import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import {useApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  title: string;
  balance: string;
};

export default function AssetsItem(props: Props | Readonly<Props>) {
  const context = useApplicationContext();
  const theme = context.theme;

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: theme.bgOnBgApp,
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
