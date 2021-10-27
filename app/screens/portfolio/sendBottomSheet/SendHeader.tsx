import React, {useContext} from 'react';
import {View} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import ClearSVG from 'components/svg/ClearSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {SelectedTokenContext} from 'contexts/SelectedTokenContext';

type Props = {
  onClose: () => void;
};

function SendHeader({onClose}: Props): JSX.Element {
  const {theme} = useContext(ApplicationContext);
  const {selectedToken, tokenLogo} = useContext(SelectedTokenContext);
  return (
    <View
      style={{
        flexDirection: 'row',
        marginTop: -16,
      }}>
      <View style={{flex: 1}}>
        <AvaListItem.Base
          label={<AvaText.Heading3>{selectedToken?.name}</AvaText.Heading3>}
          title={
            <AvaText.Heading1>{`${selectedToken?.balanceDisplayValue} ${selectedToken?.symbol}`}</AvaText.Heading1>
          }
          subtitle={
            <AvaText.Body2>
              ${selectedToken?.balanceUsdDisplayValue} USD
            </AvaText.Body2>
          }
          leftComponent={tokenLogo()}
          titleAlignment={'flex-start'}
        />
      </View>
      <AvaButton.Icon onPress={onClose}>
        <ClearSVG
          color={theme.colorIcon1}
          backgroundColor={theme.colorBg2}
          size={40}
        />
      </AvaButton.Icon>
    </View>
  );
}

export default SendHeader;
