import React, {useState} from 'react';
import {Appearance, Linking, StyleSheet, View} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import TextTitle from 'components/TextTitle';
import {COLORS, COLORS_NIGHT} from 'resources/Constants';
import TextLabel from 'components/TextLabel';
import TextAmount from 'components/TextAmount';
import moment from 'moment';
import ImgButtonAva from 'components/ImgButtonAva';

type Props = {
  date: string;
  info: string;
  amount: string;
  explorerUrl: string;
  type?: 'import' | 'export';
  address?: string;
};

export default function TransactionItem(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode] = useState(commonViewModel.isDarkMode);

  const onExplorer = (url: string): void => {
    Linking.openURL(url).then(value => {
      console.log('Linking: ' + value);
    });
  };

  let THEME = isDarkMode ? COLORS_NIGHT : COLORS;
  const explorerIcon = isDarkMode
    ? require('assets/icons/search_dark.png')
    : require('assets/icons/search_light.png');
  const date = moment(props.date).format('MMM DD, YYYY');
  return (
    <View
      style={[
        {
          borderTopColor: THEME.primaryColorLight,
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
