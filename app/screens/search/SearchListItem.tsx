import React, {FC} from 'react';
import {Image} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';

type Props = {
  balance?: string;
  name: string;
  image?: string;
  onPress?: () => void;
};

const SearchListItem: FC<Props> = ({balance, name, image, onPress}) => {
  return (
    <>
      <AvaListItem.Base
        title={name}
        leftComponent={<Image source={{uri: image}} />}
        rightComponent={<AvaText.Body2>{balance}</AvaText.Body2>}
        onPress={onPress}
      />
    </>
  );
};

export default SearchListItem;
