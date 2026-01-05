import { Action } from '@reduxjs/toolkit'
import { onLogOut, onRehydrationComplete } from 'store/app'
import { selectDistinctID } from 'store/posthog'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import Branch from 'react-native-branch'
import { noop } from '@avalabs/core-utils-sdk'

export const addBranchListeners = (startListening: AppStartListening): void => {
  const branchIdentifyUser = async (
    _: Action,
    listenerApi: AppListenerEffectAPI
  ): Promise<void> => {
    const distinctId = selectDistinctID(listenerApi.getState())
    Branch.setIdentity(distinctId)
    Branch.setRequestMetadata('posthog_distinct_id', distinctId)
    Branch.subscribe(() => noop)
  }

  const branchLogout = (_: Action, __: AppListenerEffectAPI): void => {
    Branch.logout()
  }

  startListening({
    actionCreator: onRehydrationComplete,
    effect: branchIdentifyUser
  })

  startListening({
    actionCreator: onLogOut,
    effect: branchLogout
  })
}
