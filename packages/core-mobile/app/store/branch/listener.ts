import { Action } from '@reduxjs/toolkit'
import { onAppUnlocked, onLogOut } from 'store/app'
import { selectDistinctID } from 'store/posthog'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import Branch from 'react-native-branch'

export const addBranchListeners = (startListening: AppStartListening): void => {
  const branchIdentifyUser = (
    _: Action,
    listenerApi: AppListenerEffectAPI
  ): void => {
    const distinctId = selectDistinctID(listenerApi.getState())
    Branch.setIdentity(distinctId)
  }

  const branchLogout = (_: Action, __: AppListenerEffectAPI): void => {
    Branch.logout()
  }

  startListening({
    actionCreator: onAppUnlocked,
    effect: branchIdentifyUser
  })

  startListening({
    actionCreator: onLogOut,
    effect: branchLogout
  })
}
