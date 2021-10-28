import React, {FC, ReactNode, useContext} from 'react';
import {Image, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from './AvaText';
import AddSVG from 'components/svg/AddSVG';

interface BaseProps {
  image?: string | ReactNode;
  title: string | ReactNode;
  message: string | ReactNode;
  additionalItems?: ReactNode;
}

const ZeroStateBase: FC<BaseProps> = ({
  image,
  title,
  message,
  additionalItems,
}) => {
  const theme = useContext(ApplicationContext).theme;

  function getImage() {
    if (!image) {
      return null;
    }

    if (typeof image === 'string') {
      return <Image source={{uri: image}} />;
    }
    return <View>{image}</View>;
  }

  function getTitle() {
    if (typeof title === 'string') {
      return (
        <AvaText.Heading2 textStyle={{marginTop: 16}}>{title}</AvaText.Heading2>
      );
    }
    return <View style={{marginTop: 16}}>{title}</View>;
  }

  function getMessage() {
    if (typeof message === 'string') {
      return <AvaText.Body2>{message}</AvaText.Body2>;
    }
    return <View>{message}</View>;
  }

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      }}>
      {getImage()}
      {getTitle()}
      {getMessage()}
      {additionalItems}
    </View>
  );
};

interface ZeroStatePorfolioProps {
  additionalItem?: ReactNode;
}

function ZeroStatePortfolio({additionalItem}: ZeroStatePorfolioProps) {
  const title = 'Your wallet is empty';
  const message = 'Add tokens using the following options';

  return (
    <ZeroStateBase
      title={title}
      message={message}
      image={<AddSVG size={140} />}
      additionalItems={additionalItem}
    />
  );
}

const ZeroState = {
  Portfolio: ZeroStatePortfolio,
};

export default ZeroState;
