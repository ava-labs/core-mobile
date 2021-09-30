import React, {FC, useContext} from 'react';
import {Alert, View} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import CarrotSVG from 'components/svg/CarrotSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Props {
  currency?: string;
}
const CurrencyItem: FC<Props> = ({currency = 'USD'}) => {
  const theme = useContext(ApplicationContext).theme;
  const customNav = () => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flex: 1,
      }}>
      <AvaText.Body2 textStyle={{paddingRight: 12, color: theme.txtListItem}}>
        {currency}
      </AvaText.Body2>
      <CarrotSVG />
    </View>
  );

  return (
    <>
      <AvaListItem.Custom
        leftComponent={null}
        title={'Currency'}
        rightComponent={customNav()}
        onPress={() => {
          Alert.alert('naviagate to currency picker');
        }}
      />
    </>
  );
};

export default CurrencyItem;
