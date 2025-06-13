import { ChainName } from 'services/network/consts'

export const SHOW_RECOVERY_PHRASE = `Show recovery\nphrase`

export enum AddressType {
  EVM = ChainName.AVALANCHE_C_EVM,
  EVM_TESTNET = ChainName.AVALANCHE_C_EVM_TESTNET,
  XP = ChainName.AVALANCHE_XP,
  XP_TESTNET = ChainName.AVALANCHE_XP_TESTNET,
  BTC = ChainName.BITCOIN,
  BTC_TESTNET = ChainName.BITCOIN_TESTNET,
  SOLANA = ChainName.SOLANA,
  SOLANA_DEVNET = ChainName.SOLANA_DEVNET
}
