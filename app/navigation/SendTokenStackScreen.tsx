import React from 'react';
import {
  TokenType,
  useSelectedTokenContext,
} from 'contexts/SelectedTokenContext';
import {
  AntWithBalance,
  ERC20WithBalance,
} from '@avalabs/wallet-react-components';
import SendAvaxStack from 'screens/sendAvax/SendAvaxStack';
import SendERC20Stack from 'screens/sendERC20/SendERC20Stack';
import SendANTStack from 'screens/sendANT/SendANTStack';

type Props = {
  onClose: () => void;
};

const SendTokenStackScreen = ({onClose}: Props) => {
  const {selectedToken, tokenType} = useSelectedTokenContext();

  return {
    [TokenType.AVAX]: <SendAvaxStack onClose={onClose} />,
    [TokenType.ERC20]: (
      <SendERC20Stack
        token={selectedToken as ERC20WithBalance}
        onClose={onClose}
      />
    ),
    [TokenType.ANT]: (
      <SendANTStack token={selectedToken as AntWithBalance} onClose={onClose} />
    ),
  }[tokenType(selectedToken) ?? TokenType.AVAX];
};

export default SendTokenStackScreen;
