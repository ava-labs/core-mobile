import React, {FC} from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import Avatar from 'components/Avatar';

interface Props {
  tokenName: string;
  tokenPrice: string;
  tokenPriceUsd?: string;
  image?: string;
  symbol?: string;
  onPress?: () => void;
}

const PortfolioListItem: FC<Props> = ({
  tokenName,
  tokenPrice,
  tokenPriceUsd,
  image,
  symbol,
  onPress,
}) => {
  const theme = useApplicationContext().theme;
  const title = tokenName;

  const subTitle = (
    <AvaListItem.CurrencyAmount
      value={
        <AvaText.Body2 ellipsizeMode={'tail'}>{`${tokenPrice} `}</AvaText.Body2>
      }
      currency={<AvaText.Body2>{`${symbol?.toUpperCase()}`}</AvaText.Body2>}
    />
  );

  return (
    <View
      style={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.listItemBg + 'D9',
      }}>
      <AvaListItem.Base
        title={<AvaText.Heading2>{title}</AvaText.Heading2>}
        titleAlignment={'flex-start'}
        subtitle={subTitle}
        leftComponent={
          <Avatar.Custom
            name={tokenName}
            symbol={symbol}
            logoUri={image}
            size={40}
          />
        }
        rightComponent={
          <AvaText.Heading3 currency ellipsizeMode={'tail'}>
            {tokenPriceUsd}
          </AvaText.Heading3>
        }
        onPress={onPress}
      />
    </View>
  );
};

export default React.memo(PortfolioListItem);
