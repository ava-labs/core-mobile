import Blockaid from '@blockaid/client'

export type TransactionScanResponse = Blockaid.TransactionScanResponse
export type TransactionScanSupportedChain =
  Blockaid.TransactionScanSupportedChain
export type TransactionSimulation = Blockaid.TransactionSimulation
export type Asset =
  | Blockaid.Erc20TokenDetails
  | Blockaid.Erc1155TokenDetails
  | Blockaid.Erc721TokenDetails
  | Blockaid.NonercTokenDetails
  | Blockaid.NativeAssetDetails
export type AssetDiff = Blockaid.GeneralAssetDiff
export type SiteScanResponse = Blockaid.SiteScanResponse
export type MaliciousActivityType = 'Transaction' | 'SessionProposal'
