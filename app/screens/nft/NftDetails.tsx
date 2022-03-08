import React, {useMemo} from 'react';
import {Image, ScrollView, StyleSheet, View} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {NFTStackParamList} from 'navigation/wallet/NFTScreenStack';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import {Space} from 'components/Space';
import {
  NFTItemData,
  NFTItemExternalDataAttribute,
} from 'screens/nft/NftCollection';

export type NftDetailsProps = {
  onPicturePressed: (url: string, urlSmall: string) => void;
  onSendPressed: (item: NFTItemData) => void;
};

export default function NftDetails({
  onPicturePressed,
  onSendPressed,
}: NftDetailsProps) {
  const {params} = useRoute<RouteProp<NFTStackParamList>>();
  const item = useMemo(() => params!.nft, [params]) as NFTItemData;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvaText.Heading1>
        {item.collection.contract_name} {item.token_id}
      </AvaText.Heading1>
      <Space y={24} />
      <AvaButton.Base
        onPress={() =>
          onPicturePressed(
            item.external_data.image,
            item.external_data.image_256,
          )
        }>
        <Image
          style={styles.imageStyle}
          source={{uri: item.external_data.image_512}}
        />
      </AvaButton.Base>
      <Space y={24} />
      <AvaButton.PrimaryLarge onPress={() => onSendPressed(item)}>
        Send
      </AvaButton.PrimaryLarge>
      <Space y={24} />
      <AvaText.Heading2>Description</AvaText.Heading2>
      <AvaText.Body2>{item.external_data.owner}</AvaText.Body2>
      <Space y={24} />
      <AvaText.Heading2>Properties</AvaText.Heading2>
      <Space y={16} />
      {renderProps(item.external_data.attributes)}
    </ScrollView>
  );
}

const renderProps = (attributes: NFTItemExternalDataAttribute[]) => {
  return attributes.map((attr, i) => {
    return (
      <View key={i}>
        <AvaText.Body2>{attr.trait_type}</AvaText.Body2>
        <Space y={4} />
        <AvaText.Heading3>{attr.value}</AvaText.Heading3>
      </View>
    );
  });
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  imageStyle: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'contain',
  },
});
