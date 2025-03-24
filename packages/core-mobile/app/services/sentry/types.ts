/**
 * Keeps track of all possible transaction names
 */
export type TransactionName =
  | 'get-balances'
  | 'get-nft'
  | 'get-nfts'
  | 'send-token'
  | 'send-nft'
  | 'swap'
  | 'sign-transaction'
  | 'send-transaction'

/**
 * Keeps track of all possible op names
 */
export type OpName =
  | 'svc.balance.get_for_account'
  | 'svc.balance.get_for_address'
  | 'svc.balance.btc.get'
  | 'svc.balance.get'
  | 'svc.balance.glacier.get'
  | 'svc.network.send_transaction'
  | 'svc.nft.get_provider'
  | 'svc.nft.fetchNfts'
  | 'svc.nft.fetchNft'
  | 'svc.send.send'
  | 'svc.send.btc.get_trx_request'
  | 'svc.send.btc.validate_and_calc_fees'
  | 'svc.send.evm.validate_and_calc_fees'
  | 'svc.send.evm.get_trx_request'
  | 'svc.send.pvm.validate_and_calc_fees'
  | 'svc.send.pvm.get_trx_request'
  | 'svc.swap.get_rate'
  | 'svc.swap.get_paraswap_spender'
  | 'svc.swap.build_trx'
  | 'svc.wallet.sign'
  | 'svc.wallet.get_wallet'
  | 'svc.swap.contract_allowance'
  | 'svc.swap.contract_estimate_gas'
  | 'svc.send.avm.get_trx_request'
  | 'svc.send.avm.validate_and_calc_fees'

export const SentryStorage = 'sentry_sample_rate'
