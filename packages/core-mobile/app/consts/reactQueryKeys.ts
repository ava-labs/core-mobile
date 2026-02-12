export enum ReactQueryKeys {
  ACCOUNT_BALANCE = 'accountBalance',
  ACCOUNTS_BALANCES = 'accountsBalances',
  BALANCE_SUPPORTED_CHAINS = 'balanceSupportedChains',
  XP_ADDRESSES = 'xpAddresses',

  // defi
  DEFI_EXCHANGE_RATES = 'defiExchangeRates',
  DEFI_PROTOCOL_LIST = 'deFiProtocolList',
  DEFI_PROTOCOL = 'deFiProtocol',
  DEFI_CHAIN_LIST = 'deFiChainList',
  DEFI_PROTOCOL_INFORMATION_LIST = 'deFiProtocolInformationList',

  NETWORK_FEE = 'networkFee',
  NFTS = 'nfts',

  NETWORKS = 'networks',
  NETWORK_CONTRACT_TOKENS = 'networkContractTokens',
  WATCHLIST_TOP_TOKENS = 'watchlistTopTokens',
  WATCHLIST_TRENDING_TOKENS = 'watchlistTrendingTokens',
  WATCHLIST_TOKEN_SEARCH = 'watchlistTokenSearch',
  LAST_TRANSACTED_ERC20_NETWORKS = 'lastTransactedErc20Networks',

  FEATURED_PROJECTS = 'featuredProjects',
  FEATURED_EDUCATION_ARTICLES = 'featuredEducationArticles',
  ECOSYSTEM_PROJECTS = 'ecosystemProjects',
  FAVORITE_PROJECTS = 'favoriteProjects',

  // seedless
  USER_MFA = 'userMfa',

  SIMPLE_PRICES = 'simplePrices',

  // meld
  MELD_SEARCH_CRYPTO_CURRENCIES = 'meldSearchCryptoCurrencies',
  MELD_SEARCH_COUNTRIES = 'meldSearchCountries',
  MELD_SEARCH_FIAT_CURRENCIES = 'meldSearchFiatCurrencies',
  MELD_SEARCH_SERVICE_PROVIDERS = 'meldSearchServiceProviders',
  MELD_GET_PURCHASE_LIMITS = 'meldGetPurchaseLimits',
  MELD_GET_SELL_LIMITS = 'meldGetSellLimits',
  MELD_SEARCH_DEFAULTS_BY_COUNTRY = 'meldSearchDefaultsByCountry',
  MELD_SEARCH_PAYMENT_METHODS = 'meldSearchPaymentMethods',
  MELD_CREATE_CRYPTO_QUOTE = 'meldCreateCryptoQuote',

  TERMS_OF_USE = 'termsOfUse',

  // bridge
  BRIDGE_CONFIG = 'bridgeConfig',

  // fusion
  FUSION_SUPPORTED_CHAINS = 'fusionSupportedChains',
  FUSION_TOKENS = 'fusionTokens',

  // deposit
  AAVE_AVAILABLE_MARKETS = 'aaveAvailableMarkets',
  BENQI_AVAILABLE_MARKETS = 'benqiAvailableMarkets',
  BENQI_ACCOUNT_SNAPSHOT = 'benqiAccountSnapshot',

  // borrow
  AAVE_USER_BORROW_DATA = 'aaveUserBorrowData',
  BENQI_USER_BORROW_DATA = 'benqiUserBorrowData',

  // rewards
  MERKL_USER_REWARDS = 'merklUserRewards',
  BENQI_REWARDS = 'benqiRewards'
}
