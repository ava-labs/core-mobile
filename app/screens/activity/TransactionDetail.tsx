import React, {FC, useContext} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Props {}

const TransactionDetail: FC<Props> = props => {
  const theme = useContext(ApplicationContext).theme;

  return (
    <View style={{backgroundColor: theme.bgApp}}>
      <View />
    </View>
  );
};

export default TransactionDetail;
