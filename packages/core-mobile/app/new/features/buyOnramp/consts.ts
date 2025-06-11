export enum ServiceProviderCategories {
  BankLinking = 'BANK_LINKING',
  CryptoOnramp = 'CRYPTO_ONRAMP',
  CryptoOfframp = 'CRYPTO_OFFRAMP',
  CryptoTransfer = 'CRYPTO_TRANSFER',
  FiatPayments = 'FIAT_PAYMENTS'
}

export enum ServiceProviderStatus {
  LIVE = 'LIVE',
  RECENTLY_ADDED = 'RECENTLY_ADDED',
  BUILDING = 'BUILDING'
}

export enum MELD_CURRENCY_CODES {
  BTC = 'BTC',
  USDC = 'USDC',
  AVAXC = 'AVAXC'
}

export const NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS =
  '0x0000000000000000000000000000000000000000'
