import { AppListenerEffectAPI } from 'store/index'
import FCMService from 'services/fcm/FCMService'
import { isAnyOf } from '@reduxjs/toolkit'
import { onAppLocked, onBackground } from 'store/app'

export async function manageForegroundNotificationSubscription(
  listenerApi: AppListenerEffectAPI
): Promise<void> {
  const { condition } = listenerApi
  const unsubscribe = FCMService.listenForMessagesForeground()
  await condition(isAnyOf(onBackground, onAppLocked))
  unsubscribe()
}
