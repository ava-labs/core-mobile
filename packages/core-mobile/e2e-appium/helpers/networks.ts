import common from '../locators/commonEls.loc'

export type Network = {
  name: string
  haveToggle: boolean
  secondName?: string
  data?: {
    rpcUrl?: string
    explorerUrl?: string
    tokenSymbol: string
    tokenName: string
    chainId: string
  }
}

export const customNetwork: Network = {
  name: 'Shape',
  haveToggle: true,
  data: {
    rpcUrl: 'https://mainnet.shape.network/',
    chainId: '360',
    tokenSymbol: 'ETH',
    tokenName: 'ETH'
  }
}
export const networks: Network[] = [
  {
    name: common.cChain,
    secondName: common.cChain_2,
    haveToggle: false,
    data: {
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      explorerUrl: 'https://subnets.avax.network/c-chain',
      chainId: '43114',
      tokenSymbol: 'AVAX',
      tokenName: 'Avalanche'
    }
  },
  {
    name: common.pChain,
    haveToggle: false,
    data: {
      rpcUrl: 'https://api.avax.network',
      explorerUrl: 'https://subnets.avax.network/p-chain',
      chainId: '4503599627370471',
      tokenSymbol: 'AVAX',
      tokenName: 'Avalanche'
    }
  },
  {
    name: common.xChain,
    haveToggle: true,
    data: {
      rpcUrl: 'https://api.avax.network',
      explorerUrl: 'https://subnets.avax.network/x-chain',
      chainId: '4503599627370469',
      tokenSymbol: 'AVAX',
      tokenName: 'Avalanche'
    }
  },
  {
    name: common.bitcoin,
    haveToggle: false,
    data: {
      explorerUrl: 'https://www.blockchain.com/btc',
      chainId: '4503599627370475',
      tokenSymbol: 'BTC',
      tokenName: 'Bitcoin'
    }
  },
  {
    name: common.ethereum,
    haveToggle: false,
    data: {
      rpcUrl: 'https://proxy-api.avax.network/proxy/infura/mainnet',
      explorerUrl: 'https://etherscan.io/',
      chainId: '1',
      tokenSymbol: 'ETH',
      tokenName: 'Ethereum'
    }
  },
  {
    name: common.solana,
    haveToggle: false,
    data: {
      explorerUrl: 'https://solscan.io/',
      chainId: '4503599627369476',
      tokenSymbol: 'SOL',
      tokenName: 'SOL'
    }
  },
  {
    name: common.optimism,
    haveToggle: true,
    data: {
      rpcUrl: 'https://mainnet.optimism.io',
      explorerUrl: 'https://optimistic.etherscan.io',
      chainId: '10',
      tokenSymbol: 'ETH',
      tokenName: 'Ethereum'
    }
  },
  {
    name: common.base,
    haveToggle: true,
    data: {
      rpcUrl: 'https://mainnet.base.org',
      explorerUrl: 'https://basescan.org',
      chainId: '8453',
      tokenSymbol: 'ETH',
      tokenName: 'Ethereum'
    }
  },
  {
    name: common.arbitrum,
    haveToggle: true,
    data: {
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      explorerUrl: 'https://arbiscan.io',
      chainId: '42161',
      tokenSymbol: 'ETH',
      tokenName: 'Ethereum'
    }
  }
]
