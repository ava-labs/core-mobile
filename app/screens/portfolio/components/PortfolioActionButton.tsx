import React, {useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import ArrowSVG from 'components/svg/ArrowSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface PortfolioButtonProps {
  caption: string;
  direction: 'send' | 'buy' | 'receive';
  onPress?: () => void;
}

function PortfolioActionButtonBase({
  caption,
  direction,
  onPress,
}: PortfolioButtonProps) {
  const context = useContext(ApplicationContext);
  function getArrowOrientation() {
    switch (direction) {
      case 'send':
        return '225deg';
      case 'receive':
        return '45deg';
      default:
        return '0deg';
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 76,
        height: 73,
        borderRadius: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: context.theme.buttonIconOutline,
        opacity: 0.8,
        zIndex: 2,
      }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          backgroundColor: '#F64942',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View style={{transform: [{rotate: getArrowOrientation()}]}}>
          <ArrowSVG />
        </View>
      </View>
      <Text
        style={{fontSize: 14, lineHeight: 17, color: context.theme.buttonIcon}}>
        {caption}
      </Text>
    </TouchableOpacity>
  );
}

function PortfolioActionButtonSend() {
  return <PortfolioActionButtonBase caption="Send" direction={'send'} />;
}
function PortfolioActionButtonReceive() {
  return <PortfolioActionButtonBase caption="Receive" direction={'receive'} />;
}
function PortfolioActionButtonBuy() {
  return <PortfolioActionButtonBase caption="Buy" direction={'buy'} />;
}

const PortfolioActionButton = {
  Send: PortfolioActionButtonSend,
  Receive: PortfolioActionButtonReceive,
  Buy: PortfolioActionButtonBuy,
};

export default PortfolioActionButton;
