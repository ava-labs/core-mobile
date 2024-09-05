import { AppListenerEffectAPI } from 'store/index'
import FCMService from 'services/fcm/FCMService'
import { isAnyOf } from '@reduxjs/toolkit'
import { onBackground } from 'store/app'

//Ensure subscription happens only once
let subscribed = false

export async function manageForegroundNotificationSubscription(
  listenerApi: AppListenerEffectAPI
): Promise<void> {
  const { condition } = listenerApi
  if (subscribed) return
  subscribed = true
  const unsubscribe = FCMService.listenForMessagesForeground()
  await condition(isAnyOf(onBackground))
  unsubscribe()
  subscribed = false
}
