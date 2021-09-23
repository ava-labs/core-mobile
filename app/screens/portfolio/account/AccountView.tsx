import React, {useContext} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import AddSVG from 'components/svg/AddSVG';
import Divider from 'components/Divider';
import AccountItem from 'screens/portfolio/account/AccountItem';
import {useAccount} from 'screens/portfolio/account/useAccount';
import {Account} from 'dto/Account';
import ButtonAva from 'components/ButtonAva';

function AccountView(): JSX.Element {
  const context = useContext(ApplicationContext);
  const {accounts, setSelectedAccount} = useAccount();

  const onSelect = () => {
    setSelectedAccount(accounts[0]); //todo: get selected account from carousel
  };

  return (
    <View style={{flex: 1, backgroundColor: context.theme.bgApp, padding: 16}}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <AvaText.Heading1>My accounts</AvaText.Heading1>
        <AddSVG />
      </View>
      <Divider size={16} />
      {
        //todo: wrap accountElements in card carousel
      }
      {accountElements(accounts)}
      <ButtonAva text={'Select'} onPress={onSelect} />
    </View>
  );
}

const accountElements = (accounts: Account[]): Element[] => {
  const elements: Element[] = [];

  accounts.forEach(account => {
    elements.push(<AccountItem account={account} />);
  });
  return elements;
};

export default AccountView;
