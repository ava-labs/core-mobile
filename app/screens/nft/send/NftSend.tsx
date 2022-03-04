import React, {useEffect} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {useNftSendContext} from 'navigation/wallet/NFTSendStack';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import InputText from 'components/InputText';
import AvaButton from 'components/AvaButton';
import AddressBookSVG from 'components/svg/AddressBookSVG';
import AddressBookLists from 'components/addressBook/AddressBookLists';
import FlexSpacer from 'components/FlexSpacer';
import {useAddressBookLists} from 'components/addressBook/useAddressBookLists';
import {AddrBookItemType, Contact} from 'Repo';
import {Account} from 'dto/Account';
import {NFTItem} from 'screens/nft/NFTItem';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Row} from 'components/Row';

export type NftSendScreenProps = {
  onNext: () => void;
};

export default function NftSend({onNext}: NftSendScreenProps) {
  const {nft, setAddressTo, addressTo} = useNftSendContext();
  const {
    saveRecentContact,
    onContactSelected: selectContact,
    reset: resetAddressBookList,
    setShowAddressBook,
    showAddressBook,
  } = useAddressBookLists();

  const onNextPress = () => {
    saveRecentContact();
    onNext();
  };

  useEffect(() => {
    if (addressTo) {
      setShowAddressBook(false);
    }
  }, [addressTo]);

  const onContactSelected = (
    item: Contact | Account,
    type: AddrBookItemType,
  ) => {
    setAddressTo(item.address);
    selectContact(item, type);
  };

  return (
    <View style={styles.container}>
      <AvaText.LargeTitleBold>Send</AvaText.LargeTitleBold>
      <Space y={20} />
      <AvaText.Heading3>Send to</AvaText.Heading3>
      <View style={{marginHorizontal: -16}}>
        <InputText
          placeholder="Enter 0x Address"
          multiline={true}
          onChangeText={text => {
            setAddressTo(text);
            resetAddressBookList();
          }}
          text={addressTo}
        />
        {!addressTo && (
          <View
            style={{
              position: 'absolute',
              right: 24,
              justifyContent: 'center',
              height: '100%',
            }}>
            <AvaButton.Icon
              onPress={() => setShowAddressBook(!showAddressBook)}>
              <AddressBookSVG />
            </AvaButton.Icon>
          </View>
        )}
      </View>
      {showAddressBook ? (
        <View style={{marginHorizontal: -16, flex: 1}}>
          <AddressBookLists onContactSelected={onContactSelected} />
        </View>
      ) : (
        <>
          <AvaText.Heading3>Collectible</AvaText.Heading3>
          <CollectibleItem nft={nft} />
          <FlexSpacer />
        </>
      )}
      <AvaButton.PrimaryLarge
        // disabled={!canSubmit}
        onPress={onNextPress}
        style={{marginBottom: 16}}>
        Next
      </AvaButton.PrimaryLarge>
    </View>
  );
}

const CollectibleItem = ({nft}: {nft: NFTItem}) => {
  const {theme} = useApplicationContext();
  return (
    <View
      style={[
        styles.collectibleItem,
        {
          backgroundColor: theme.listItemBg + 'D9',
        },
      ]}>
      <Row>
        <Image
          style={styles.nftImage}
          source={{uri: nft.imageURL}}
          width={80}
          height={80}
        />
        <Space x={16} />
        <AvaText.Heading3 textStyle={{flex: 1}}>{nft.title}</AvaText.Heading3>
      </Row>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1,
  },
  collectibleItem: {
    marginVertical: 4,
    borderRadius: 8,
    padding: 16,
  },
  nftImage: {
    borderRadius: 8,
  },
});
