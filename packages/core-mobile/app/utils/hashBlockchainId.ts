import * as Crypto from 'crypto'

//github.com/gergelylovas/chain-agnostic-namespaces/pull/1/files#diff-cf7185539a48e85d069d194c1c17d7cfa0317b3caa3a89c92e797e3717e49d59R40
export function hashBlockchainId({
  blockchainId,
  isTestnet
}: {
  blockchainId: string
  isTestnet?: boolean
}): string {
  const blockChainIdWithPrefix = isTestnet
    ? 'fuji' + blockchainId
    : blockchainId
  const hash = Crypto.createHash('sha256')
    .update(blockChainIdWithPrefix)
    .digest('base64url')
    .substring(0, 32)
  return 'avax:' + hash
}
