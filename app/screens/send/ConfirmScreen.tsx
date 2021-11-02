import React from 'react';
import {TokenType, useSelectedTokenContext} from 'contexts/SelectedTokenContext';
import SendAvaxConfirm from 'screens/sendAvax/SendAvaxConfirm';
import SendERC20Confirm from 'screens/sendERC20/SendERC20Confirm';
import SendANTConfirm from 'screens/sendANT/SendANTConfirm';

export default function ConfirmScreen() {
  const {selectedToken, tokenType} = useSelectedTokenContext();

  return {
    [TokenType.AVAX]: <SendAvaxConfirm />,
    [TokenType.ERC20]: <SendERC20Confirm />,
    [TokenType.ANT]: <SendANTConfirm />,
  }[tokenType(selectedToken) ?? TokenType.AVAX] as JSX.Element;
}
