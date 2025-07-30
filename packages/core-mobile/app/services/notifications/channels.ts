import { AndroidChannel, AndroidImportance } from '@notifee/react-native'

export enum ChannelId {
  STAKING_COMPLETE = 'stakeComplete',
  BALANCE_CHANGES = 'balanceChanges',
  PRODUCT_ANNOUNCEMENTS = 'productAnnouncements',
  OFFERS_AND_PROMOTIONS = 'offersAndPromotions',
  MARKET_NEWS = 'marketNews',
  PRICE_ALERTS = 'priceAlerts',
  FAV_TOKEN_PRICE_ALERTS = 'favTokenPriceAlerts'
}

export enum NewsChannelId {
  PRODUCT_ANNOUNCEMENTS = 'productAnnouncements',
  OFFERS_AND_PROMOTIONS = 'offersAndPromotions',
  MARKET_NEWS = 'marketNews',
  PRICE_ALERTS = 'priceAlerts'
}

//This is system default channel, we don't need to create it, just use it's id
export const DEFAULT_ANDROID_CHANNEL = 'miscellaneous'

export interface AvaxAndroidChannel extends AndroidChannel {
  id: ChannelId
  title: string
  subtitle: string
}

/**
 * This is "database" of all notification channels we are supporting.
 * It should be immutable so use getAllChannels function to get cloned items.
 */
export const notificationChannels = [
  {
    id: ChannelId.STAKING_COMPLETE,
    name: 'Stake Complete',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Stake',
    subtitle: 'Stake complete alerts'
  } as AvaxAndroidChannel,
  {
    id: ChannelId.BALANCE_CHANGES,
    name: 'Balance Changes',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Balance',
    subtitle: 'Wallet balance change alerts',
    sound: 'core_receive'
  } as AvaxAndroidChannel,
  {
    id: ChannelId.PRODUCT_ANNOUNCEMENTS,
    name: 'Product Announcements',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Product announcements',
    subtitle: 'Learn about new features and changes',
    sound: 'default'
  } as AvaxAndroidChannel,
  {
    id: ChannelId.OFFERS_AND_PROMOTIONS,
    name: 'Special Offers and Promotions',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Special offers and promotions',
    subtitle: 'Airdrops and promotional offers',
    sound: 'default'
  } as AvaxAndroidChannel,
  {
    id: ChannelId.MARKET_NEWS,
    name: 'Market News',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Market news',
    subtitle: 'News and market information alerts',
    sound: 'default'
  } as AvaxAndroidChannel,
  {
    id: ChannelId.PRICE_ALERTS,
    name: 'Price Alerts',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Price alerts',
    subtitle: 'Token price movement alerts',
    sound: 'default'
  } as AvaxAndroidChannel,
  {
    id: ChannelId.FAV_TOKEN_PRICE_ALERTS,
    name: 'Favorite Token Alerts',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Favorite token alerts',
    subtitle: 'Favorite token price movement alerts',
    sound: 'default'
  } as AvaxAndroidChannel
]
