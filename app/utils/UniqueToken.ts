import {
  AntWithBalance,
  ERC20WithBalance,
  TokenWithBalance,
} from '@avalabs/wallet-react-components';

export function getTokenUID(token: TokenWithBalance): string {
  if (token.isAvax) {
    return 'ID-AVAX';
  }
  if (token.isErc20) {
    return (token as ERC20WithBalance).address;
  }
  if (token.isAnt) {
    return (token as AntWithBalance).assetID;
  }
  throw new Error('unknown token');
}
