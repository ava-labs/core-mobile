import { Action } from '@reduxjs/toolkit'
import { onForeground, onLogOut, onRehydrationComplete } from 'store/app'
import { selectDistinctID } from 'store/posthog'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import Branch, { BranchEvent, BranchParams } from 'react-native-branch'
import Logger from 'utils/Logger'

export const addBranchListeners = (startListening: AppStartListening): void => {
  const branchIdentifyUser = async (
    _: Action,
    listenerApi: AppListenerEffectAPI
  ): Promise<void> => {
    const distinctId = selectDistinctID(listenerApi.getState())
    Branch.setIdentity(distinctId)
    createBranchOpenedEvent(distinctId)
  }

  const onCreatedBranchOpenedEvent = async (
    _: Action,
    listenerApi: AppListenerEffectAPI
  ): Promise<void> => {
    const distinctId = selectDistinctID(listenerApi.getState())
    createBranchOpenedEvent(distinctId)
  }

  const createBranchOpenedEvent = async (distinctId: string): Promise<void> => {
    Branch.setRequestMetadata('posthog_distinct_id', distinctId)
    const latestReferringParams = await Branch.getLatestReferringParams()

    const branchUniversalObject = await Branch.createBranchUniversalObject(
      'app_opened',
      {}
    )

    const customData = constructBranchCustomEventParams(
      distinctId,
      latestReferringParams
    )

    const event = new BranchEvent('app_opened', [branchUniversalObject], {
      customData
    })
    event
      .logEvent()
      .then(() => {
        Logger.info('branch custom event [app_opened] logged successfully')
      })
      .catch(error => {
        Logger.error('branch custom event [app_opened] logging failed', error)
      })
  }

  const constructBranchCustomEventParams = (
    distinctId: string,
    params: BranchParams
  ): Record<string, string> | undefined => {
    if (params['+clicked_branch_link'] === true) {
      return {
        posthog_distinct_id: distinctId,
        ...Object.fromEntries(
          Object.entries(params).map(([key, value]) => [
            key,
            value?.toString() ?? ''
          ])
        )
      }
    }

    const nonBranchUrl = params['+non_branch_link']
      ? new URL(params['+non_branch_link'] as string)
      : undefined
    if (nonBranchUrl) {
      return {
        posthog_distinct_id: distinctId,
        ...Object.fromEntries(
          Object.entries(nonBranchUrl.searchParams).map(([key, value]) => [
            key,
            value.toString()
          ])
        )
      }
    }

    const url = params['+url'] ? new URL(params['+url'] as string) : undefined

    if (url) {
      return {
        posthog_distinct_id: distinctId,
        ...Object.fromEntries(
          Object.entries(url.searchParams).map(([key, value]) => [
            key,
            value.toString()
          ])
        )
      }
    }
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
