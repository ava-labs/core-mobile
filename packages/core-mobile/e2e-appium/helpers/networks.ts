import common from '../locators/commonEls.loc'

export const networks = [
  {
    networkName: common.cChain,
    networkData: {
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      explorerUrl: 'https://subnets.avax.network/c-chain',
      chainId: '43114',
      tokenSymbol: 'AVAX',
      tokenName: 'Avalanche'
    }
  },
  {
    networkName: common.pChain,
    networkData: {
      rpcUrl: 'https://api.avax.network',
      explorerUrl: 'https://subnets.avax.network/p-chain',
      chainId: '4503599627370471',
      tokenSymbol: 'AVAX',
      tokenName: 'Avalanche'
    }
  },
  {
    networkName: common.bitcoin,
    networkData: {
      explorerUrl: 'https://www.blockchain.com/btc',
      chainId: '4503599627370475',
      tokenSymbol: 'BTC',
      tokenName: 'Bitcoin'
    }
  },
  {
    networkName: common.ethereum,
    networkData: {
      rpcUrl: 'https://proxy-api.avax.network/proxy/infura/mainnet',
      explorerUrl: 'https://routescan.io',
      chainId: '1',
      tokenSymbol: 'ETH',
      tokenName: 'Ether'
    }
  },
  {
    networkName: common.solana,
    networkData: {
      explorerUrl: 'https://solscan.io/',
      chainId: '4503599627369476',
      tokenSymbol: 'SOL',
      tokenName: 'SOL'
    }
  },
  {
    networkName: common.xChain,
    networkData: {
      rpcUrl: 'https://api.avax.network',
      explorerUrl: 'https://subnets.avax.network/x-chain',
      chainId: '4503599627370469',
      tokenSymbol: 'AVAX',
      tokenName: 'Avalanche'
    }
  }
]
