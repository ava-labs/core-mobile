import { Action } from '@reduxjs/toolkit'
import { onForeground, onLogOut, onRehydrationComplete } from 'store/app'
import { selectDistinctID } from 'store/posthog'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import Branch, { BranchEvent } from 'react-native-branch'

export const addBranchListeners = (startListening: AppStartListening): void => {
  const branchIdentifyUser = async (
    _: Action,
    listenerApi: AppListenerEffectAPI
  ): Promise<void> => {
    const distinctId = selectDistinctID(listenerApi.getState())
    Branch.setIdentity(distinctId)
    Branch.setRequestMetadata('$posthog_distinct_id', distinctId)
    createBranchOpenedEvent(distinctId)
  }

  const onCreatedBranchOpenedEvent = async (
    _: Action,
    listenerApi: AppListenerEffectAPI
  ): Promise<void> => {
    const distinctId = selectDistinctID(listenerApi.getState())
    Branch.setRequestMetadata('$posthog_distinct_id', distinctId)
    createBranchOpenedEvent(distinctId)
  }

  const createBranchOpenedEvent = async (distinctId: string): Promise<void> => {
    const branchUniversalObject = await Branch.createBranchUniversalObject(
      'app_opened',
      {}
    )
    const params = {
      customData: { posthog_distinct_id: distinctId }
    }

    const event = new BranchEvent('app_opened', [branchUniversalObject], params)
    event.logEvent()
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

  startListening({
    actionCreator: onForeground,
    effect: onCreatedBranchOpenedEvent
  })
}
