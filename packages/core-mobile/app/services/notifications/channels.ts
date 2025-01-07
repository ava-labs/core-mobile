import { AndroidChannel, AndroidImportance } from '@notifee/react-native'

export enum ChannelId {
  STAKING_COMPLETE = 'stakeComplete',
  BALANCE_CHANGES = 'balanceChanges',
  PRODUCT_ANNOUNCEMENTS = 'productAnnouncements',
  OFFERS_AND_PROMOTIONS = 'offersAndPromotions',
  MARKET_NEWS = 'marketNews'
}

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
    name: 'Staking Complete',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Stake',
    subtitle: 'Staking Complete'
  } as AvaxAndroidChannel,
  {
    id: ChannelId.BALANCE_CHANGES,
    name: 'Balance Changes',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Balance',
    subtitle: 'Notifications when your balance changes',
    sound: 'core_receive'
  } as AvaxAndroidChannel,

  // TODO: Add titles and subtitles
  {
    id: ChannelId.PRODUCT_ANNOUNCEMENTS,
    name: 'Product Announcements',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Product Announcements',
    subtitle: 'TBD'
  } as AvaxAndroidChannel,
  {
    id: ChannelId.OFFERS_AND_PROMOTIONS,
    name: 'Special Offers and Promotions',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Special Offers and Promotions',
    subtitle: 'TBD'
  } as AvaxAndroidChannel,
  {
    id: ChannelId.MARKET_NEWS,
    name: 'Market News',
    lights: false,
    vibration: false,
    importance: AndroidImportance.DEFAULT,
    title: 'Market News',
    subtitle: 'TBD'
  } as AvaxAndroidChannel
]
