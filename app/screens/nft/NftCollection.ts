export type NFTItemExternalDataAttribute = {
  trait_type: string;
  value: string;
  percentOwned: number;
};

export type NFTItemExternalData = {
  name: string;
  description: string;
  image: string;
  image_256: string;
  image_512: string;
  image_1024: string;
  animation_url: string | null;
  external_url: string;
  attributes: NFTItemExternalDataAttribute[];
  owner: string | null;
};

export type NFTItemData = {
  token_id: string;
  token_balance: string;
  token_url: string;
  supports_erc: string[];
  token_price_wei: string | null;
  token_quote_rate_eth: number | null;
  original_owner: string;
  external_data: NFTItemExternalData;
  owner: string;
  owner_address: string | null;
  burned: string | null;

  collection: NftCollection;
  isShowing: boolean;
  aspect: number;
  uid: string;
};

export type NftCollection = {
  contract_decimals: number;
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  supports_erc: string[];
  logo_url: string;
  last_transferred_at: string;
  type: string;
  balance: string;
  balance_24h: string;
  quote_rate: number;
  quote_rate_24h: number;
  quote: number;
  quote_24h: number;
  nft_data?: NFTItemData[];
};
