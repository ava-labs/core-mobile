import React, {useContext} from 'react';
import {Linking, StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import TextLabel from 'components/TextLabel';
import TextAmount from 'components/TextAmount';
import moment from 'moment';
import ImgButtonAva from 'components/ImgButtonAva';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  date: string;
  info: string;
  amount: string;
  explorerUrl: string;
  type?: 'import' | 'export';
  address?: string;
};

export default function TransactionItem(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);

  const onExplorer = (url: string): void => {
    Linking.openURL(url).then(value => {
      console.log('Linking: ' + value);
    });
  };

  const theme = context.theme;
  const explorerIcon = context.isDarkMode
    ? require('assets/icons/search_dark.png')
    : require('assets/icons/search_light.png');
  const date = moment(props.date).format('MMM DD, YYYY');
  return (
    <View
      style={[
        {
          borderTopColor: theme.accentColor,
          borderTopWidth: 1,
        },
      ]}>
      <View style={styles.horizontalLayout}>
        <View
          style={[
            {
              flexShrink: 1,
            },
          ]}>
          <TextTitle text={date} size={14} />
          <TextLabel text={props.info} />
          <TextAmount text={props.amount} type={props.type} />
          {props.address ? <TextLabel text={props.address} /> : undefined}
        </View>
        <ImgButtonAva
          src={explorerIcon}
          onPress={() => onExplorer(props.explorerUrl)}
        />
      </View>
    </View>
  );
}

const styles: any = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
