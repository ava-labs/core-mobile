import React, {useMemo} from 'react';
import {Image, ScrollView, StyleSheet, View} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {NFTStackParamList} from 'navigation/wallet/NFTScreenStack';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import {Space} from 'components/Space';
import {NFTItem} from 'screens/nft/NFTItem';

export type NftDetailsProps = {
  onPicturePressed: (url: string) => void;
};

export default function NftDetails({onPicturePressed}: NftDetailsProps) {
  const {params} = useRoute<RouteProp<NFTStackParamList>>();
  const item = useMemo(() => params!.nft, [params]) as NFTItem;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvaText.Heading1>{item.title}</AvaText.Heading1>
      <Space y={24} />
      <AvaButton.Base onPress={() => onPicturePressed(item.imageURL)}>
        <Image style={styles.imageStyle} source={{uri: item.imageURL}} />
      </AvaButton.Base>
      <Space y={24} />
      <AvaButton.PrimaryLarge>Send</AvaButton.PrimaryLarge>
      <Space y={24} />
      <AvaText.Heading2>Properties</AvaText.Heading2>
      <Space y={16} />
      {renderProps(item.properties)}
    </ScrollView>
  );
}

const renderProps = (props: {[key: string]: string}) => {
  return Object.entries(props).map(([key, value]) => {
    return (
      <View key={key}>
        <AvaText.Body2>{key}</AvaText.Body2>
        <Space y={4} />
        <AvaText.Heading3>{value}</AvaText.Heading3>
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
