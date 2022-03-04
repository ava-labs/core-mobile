import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useNftSendContext} from 'navigation/wallet/NFTSendStack';
import AvaText from 'components/AvaText';
import DotSVG from 'components/svg/DotSVG';
import {Space} from 'components/Space';
import {Row} from 'components/Row';
import Separator from 'components/Separator';
import {useApplicationContext} from 'contexts/ApplicationContext';
import Avatar from 'components/Avatar';

export type NftReviewScreenProps = {};

export default function NftReview({}: NftReviewScreenProps) {
  const {nft, setAddressTo, addressTo} = useNftSendContext();
  const {theme} = useApplicationContext();

  return (
    <View style={styles.container}>
      <AvaText.Heading1 textStyle={{marginHorizontal: 16}}>
        Send
      </AvaText.Heading1>
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: -36,
          zIndex: 2,
        }}>
        <View style={{position: 'absolute'}}>
          <DotSVG fillColor={theme.colorBg1} size={72} />
        </View>
        <Avatar.Custom name={nft.title} logoUri={nft.imageURL} />
      </View>
    </View>
  );
}

function SendRow({
  label,
  title,
  address,
}: {
  label: string;
  title: string;
  address: string;
}) {
  return (
    <>
      <Space y={8} />
      <AvaText.Body2>{label}</AvaText.Body2>
      <Row style={{justifyContent: 'space-between'}}>
        <AvaText.Heading3>{title}</AvaText.Heading3>
        <AvaText.Body1 ellipsizeMode={'middle'} textStyle={{width: 152}}>
          {address}
        </AvaText.Body1>
      </Row>
      <Space y={4} />
      <Separator />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1,
  },
});
