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

export function getDecimalsForEVM(token?: TokenWithBalance) {
  if (!token) {
    return undefined;
  }
  if (token.isAvax) {
    return 18; //on X chain Avax has 9 decimals, but on C it has 18
  }
  if (token.isAnt) {
    return undefined;
  }
  return token.denomination;
}
