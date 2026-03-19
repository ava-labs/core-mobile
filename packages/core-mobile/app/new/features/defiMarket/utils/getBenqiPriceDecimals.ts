// Benqi oracle returns price scaled to 10^(36 - tokenDecimals)
// so that price * amount always yields a 10^36-scaled USD value.
const BENQI_PRICE_ORACLE_BASE_DECIMALS = 36

export const getBenqiPriceDecimals = (tokenDecimals: number): number =>
  BENQI_PRICE_ORACLE_BASE_DECIMALS - tokenDecimals
