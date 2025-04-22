import { ChainName } from 'services/network/consts'

export const SHOW_RECOVERY_PHRASE = `Show recovery\nphrase`

export enum AddressType {
  EVM = ChainName.AVALANCHE_MAINNET,
  EVM_TESTNET = ChainName.AVALANCHE_TESTNET,
  XP = ChainName.AVALANCHE_XP,
  XP_TESTNET = ChainName.AVALANCHE_TEST_XP,
  BTC = ChainName.BITCOIN,
  BTC_TESTNET = ChainName.BITCOIN_TESTNET
}
