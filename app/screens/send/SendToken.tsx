import React, {useEffect, useMemo, useState} from 'react';
import {FlatList, ListRenderItemInfo, View} from 'react-native';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import InputText from 'components/InputText';
import TokenSelectAndAmount from 'components/TokenSelectAndAmount';
import AvaButton from 'components/AvaButton';
import AddressBookSVG from 'components/svg/AddressBookSVG';
import FlexSpacer from 'components/FlexSpacer';
import TabViewAva from 'components/TabViewAva';
import ZeroState from 'components/ZeroState';
import AddressBookItem from 'components/addressBook/AddressBookItem';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Account} from 'dto/Account';
import {useSendTokenContext} from 'contexts/SendTokenContext';
import numeral from 'numeral';
import {
  ERC20WithBalance,
  TokenWithBalance,
} from '@avalabs/wallet-react-components';
import {AccountId, Contact, RecentContact, UID} from 'Repo';

const renderCustomLabel = (title: string) => {
  return <AvaText.Heading3>{title}</AvaText.Heading3>;
};

function SendToken({
  onNext,
  token,
  contact,
}: {
  onNext: () => void;
  token?: TokenWithBalance;
  contact?: Contact;
}): JSX.Element {
  const {theme} = useApplicationContext();

  const {
    setSendToken,
    sendToken,
    setSendAmount,
    sendAmount,
    toAccount,
    fees,
    canSubmit,
    sdkError,
  } = useSendTokenContext();
  const [showAddressBook, setShowAddressBook] = useState(false);
  const {recentContacts, addressBook, addToRecentContacts} =
    useApplicationContext().repo.addressBookRepo;
  const {accounts} = useApplicationContext().repo.accountsRepo;
  const [tempRecentContact, setTempRecentContact] = useState<
    RecentContact | undefined
  >(undefined);

  const addressBookContacts = useMemo(
    () => [...addressBook.values()],
    [addressBook],
  );

  const recentAddresses = useMemo(
    () =>
      recentContacts.map(contact => {
        switch (contact.type) {
          case 'account':
            return accounts.get(contact.id as AccountId)!;
          case 'address':
            return addressBook.get(contact.id as UID)!;
        }
      }),
    [addressBook, recentContacts, accounts],
  );

  useEffect(() => {
    if (token) {
      setSendToken(token as ERC20WithBalance);
    }
  }, [setSendToken, token]);

  useEffect(() => {
    if (contact) {
      setAddress(contact);
    }
  }, [contact]);

  useEffect(() => {
    if (toAccount.address) {
      setShowAddressBook(false);
    }
  }, [toAccount.address]);

  function toggleAddressBook() {
    setShowAddressBook(!showAddressBook);
  }

  function setAddress({address, title}: {address: string; title: string}) {
    toAccount.setAddress?.(address);
    toAccount.setTitle?.(title);
  }

  const renderRecentContactItem = (
    item: ListRenderItemInfo<Contact | Account>,
  ) => {
    return (
      <AvaButton.Base
        onPress={() => {
          setAddress(item.item);
        }}>
        <AddressBookItem title={item.item.title} address={item.item.address} />
      </AvaButton.Base>
    );
  };

  const renderAddressItem = (item: ListRenderItemInfo<Contact>) => {
    return (
      <AvaButton.Base
        onPress={() => {
          setAddress(item.item);
          setTempRecentContact({id: item.item.id, type: 'address'});
        }}>
        <AddressBookItem title={item.item.title} address={item.item.address} />
      </AvaButton.Base>
    );
  };

  const renderAccountItem = (item: ListRenderItemInfo<Account>) => {
    return (
      <AvaButton.Base
        onPress={() => {
          setAddress(item.item);
          setTempRecentContact({id: item.item.index, type: 'account'});
        }}>
        <AddressBookItem title={item.item.title} address={item.item.address} />
      </AvaButton.Base>
    );
  };

  const onNextPress = () => {
    if (tempRecentContact) {
      addToRecentContacts(tempRecentContact);
    }
    onNext();
  };

  return (
    <View style={{flex: 1}}>
      <Space y={8} />
      <AvaText.Heading1 textStyle={{marginHorizontal: 16}}>
        Send
      </AvaText.Heading1>
      <Space y={24} />
      <AvaText.Heading3 textStyle={{marginHorizontal: 16}}>
        Send to
      </AvaText.Heading3>
      <Space y={4} />
      <View style={[{flex: 0, paddingStart: 4, paddingEnd: 4}]}>
        <InputText
          placeholder="Enter 0x Address"
          multiline={true}
          onChangeText={text => {
            toAccount.setTitle?.('Address');
            toAccount.setAddress?.(text);
            setTempRecentContact(undefined);
          }}
          text={toAccount.address}
        />
        {!toAccount.address && (
          <View
            style={{
              position: 'absolute',
              right: 24,
              justifyContent: 'center',
              height: '100%',
            }}>
            <AvaButton.Icon onPress={toggleAddressBook}>
              <AddressBookSVG />
            </AvaButton.Icon>
          </View>
        )}
      </View>
      <Space y={24} />
      {showAddressBook ? (
        <TabViewAva renderCustomLabel={renderCustomLabel}>
          <FlatList
            title={'Recents'}
            data={recentAddresses}
            renderItem={renderRecentContactItem}
            keyExtractor={item => item.title + item.address}
            contentContainerStyle={{paddingHorizontal: 16}}
            ListEmptyComponent={<ZeroState.NoResultsGraphical />}
          />
          <FlatList
            title={'Address Book'}
            data={addressBookContacts}
            renderItem={renderAddressItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{paddingHorizontal: 16}}
            ListEmptyComponent={<ZeroState.NoResultsGraphical />}
          />
          <FlatList
            title={'My accounts'}
            data={[...accounts.values()]}
            renderItem={renderAccountItem}
            contentContainerStyle={{paddingHorizontal: 16}}
            ListEmptyComponent={<ZeroState.NoResultsGraphical />}
          />
        </TabViewAva>
      ) : (
        <>
          <View style={{paddingHorizontal: 16}}>
            <TokenSelectAndAmount
              initAmount={sendAmount.toString()}
              initToken={sendToken}
              maxEnabled={!!toAccount.address && !!sendToken}
              onAmountSet={amount => setSendAmount(amount)}
              onTokenSelect={token => setSendToken(token as ERC20WithBalance)}
              getMaxAmount={() => {
                return (
                  numeral(sendToken?.balanceDisplayValue ?? 0).value() -
                  numeral(fees.sendFeeAvax ?? 0).value()
                ).toFixed(4);
              }}
            />
            <Space y={8} />
            <AvaText.Body3 textStyle={{color: theme.colorError}}>
              {sdkError?.message ?? ''}
            </AvaText.Body3>
          </View>
          <FlexSpacer />
        </>
      )}
      <AvaButton.PrimaryLarge
        disabled={!canSubmit}
        onPress={onNextPress}
        style={{margin: 16}}>
        Next
      </AvaButton.PrimaryLarge>
    </View>
  );
}

export default SendToken;
