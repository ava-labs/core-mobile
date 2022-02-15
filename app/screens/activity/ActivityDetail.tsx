import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaListItem from 'components/AvaListItem';
import LinkSVG from 'components/svg/LinkSVG';
import moment from 'moment';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {isTransactionERC20} from '@avalabs/wallet-react-components';
import {Space} from 'components/Space';
import useInAppBrowser from 'hooks/useInAppBrowser';
import Separator from 'components/Separator';
import {truncateAddress} from 'utils/Utils';
import {RouteProp, useRoute} from '@react-navigation/native';
import {RootStackParamList} from 'navigation/WalletScreenStack';
import DotSVG from 'components/svg/DotSVG';
import FlexSpacer from 'components/FlexSpacer';
import Avatar from 'components/Avatar';
import {Contact} from 'Repo';
import {Utils} from '@avalabs/avalanche-wallet-sdk';

function ActivityDetail() {
  const theme = useApplicationContext().theme;
  const {addressBook} = useApplicationContext().repo.addressBookRepo;
  const addressBookArray = Array.from(addressBook);
  const {params} = useRoute<RouteProp<RootStackParamList>>();
  const txItem = params?.tx;
  const date = moment(txItem.timestamp).format('MMM DD, YYYY HH:mm');
  const {openUrl} = useInAppBrowser();
  const [contact, setContact] = useState<Contact>();

  const feeBN = Utils.numberToBN(txItem.cumulativeGasUsed * txItem.gasPrice, 0);
  const fees = Utils.bnToLocaleString(feeBN, 18);

  useEffect(() => getContactMatch(), [addressBook]);

  function getContactMatch() {
    const address = txItem.isSender ? txItem.to : txItem.from;
    const filtered = addressBookArray?.filter(
      entry => entry[1].address === address,
    );
    if (filtered.length > 0) {
      setContact(filtered[0][1]);
    }
  }

  const tokenLogo = isTransactionERC20(txItem) ? (
    <Avatar.Custom
      size={57}
      name={txItem.tokenName}
      symbol={txItem.tokenSymbol}
    />
  ) : (
    <Avatar.Custom size={57} name={'Avalanche'} symbol={'AVAX'} />
  );

  return (
    <View style={{flex: 1}}>
      <View
        style={{
          backgroundColor: theme.colorBg2,
          marginTop: 45,
          paddingTop: 10,
          flex: 1,
        }}>
        <View style={styles.logoContainer}>
          <View style={{position: 'absolute'}}>
            <DotSVG fillColor={theme.colorBg1} size={72} />
          </View>
          {tokenLogo}
        </View>
        <View style={styles.headerContainer}>
          <AvaText.Heading1 textStyle={{marginTop: 16}}>
            {txItem.isSender ? '-' : '+'}
            {txItem.amountDisplayValue}
            <AvaText.Body1 color={theme.colorText2}>
              {isTransactionERC20(txItem) ? ` ${txItem.tokenSymbol}` : ' AVAX'}
            </AvaText.Body1>
          </AvaText.Heading1>
          <Space y={4} />
          <AvaText.Body2>{` Fee ${fees} AVAX`}</AvaText.Body2>
        </View>
        <Space y={16} />
        <AvaListItem.Base
          title={<AvaText.Body2>Status</AvaText.Body2>}
          titleAlignment={'flex-start'}
          rightComponent={<AvaText.Heading3>Complete</AvaText.Heading3>}
        />
        <Separator inset={16} />
        <AvaListItem.Base
          title={<AvaText.Body2>Date</AvaText.Body2>}
          titleAlignment={'flex-start'}
          rightComponent={<AvaText.Heading3>{date}</AvaText.Heading3>}
        />
        <Separator inset={16} />
        <AvaListItem.Base
          title={
            <AvaText.Body2>{txItem.isSender ? 'To' : 'From'}</AvaText.Body2>
          }
          titleAlignment={'flex-start'}
          rightComponent={
            <View style={{alignItems: 'flex-end'}}>
              {contact && <AvaText.Heading3>{contact?.title}</AvaText.Heading3>}
              <AvaText.Body1>
                {truncateAddress(txItem.isSender ? txItem.to : txItem.from)}
              </AvaText.Body1>
            </View>
          }
        />
        <Separator inset={16} />
        <AvaListItem.Base
          title={<AvaText.Body2>Transaction Type</AvaText.Body2>}
          titleAlignment={'flex-start'}
          rightComponent={
            <AvaText.Body1>
              {txItem.isSender ? 'Outgoing Transfer' : 'Incoming Transfer'}
            </AvaText.Body1>
          }
        />
        <FlexSpacer />
        {!!txItem.explorerLink && (
          <>
            <Pressable
              style={[styles.explorerLink]}
              onPress={() => {
                openUrl(txItem.explorerLink);
              }}>
              <LinkSVG color={theme.white} />
              <AvaText.ButtonLarge
                textStyle={{marginLeft: 8}}
                color={theme.white}>
                View on Explorer
              </AvaText.ButtonLarge>
            </Pressable>
            <Space y={16} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 25,
  },
  headerContainer: {
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenLogo: {
    paddingHorizontal: 16,
    width: 32,
    height: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
  explorerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 48,
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#FFFFFF26',
  },
});

export default ActivityDetail;
