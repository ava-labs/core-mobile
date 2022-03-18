import {
  GetAddressBalanceV2Item,
  NFTData,
} from '@avalabs/covalent-sdk/src/models';

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

export type NFTItemData = NFTData & {
  external_data: NFTItemExternalData;
  collection: NftCollection;
  isShowing: boolean;
  aspect: number;
  uid: string;
};

export type NftCollection = GetAddressBalanceV2Item;
