import { Action } from '@reduxjs/toolkit'
import { onForeground, onLogOut, onRehydrationComplete } from 'store/app'
import { selectDistinctID } from 'store/posthog'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import Branch, { BranchEvent } from 'react-native-branch'
import Logger from 'utils/Logger'

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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const createBranchOpenedEvent = async (distinctId: string): Promise<void> => {
    const latestReferringParams = await Branch.getLatestReferringParams()

    const branchUniversalObject = await Branch.createBranchUniversalObject(
      'app_opened',
      {}
    )

    const params = {
      customData: {
        posthog_distinct_id: distinctId,
        utm_source: latestReferringParams['utm_source']?.toString() ?? '',
        utm_campaign: latestReferringParams['utm_campaign']?.toString() ?? '',
        utm_medium: latestReferringParams['utm_medium']?.toString() ?? '',
        gclid: latestReferringParams['gclid']?.toString() ?? '',
        channel: latestReferringParams['~channel']?.toString() ?? '',
        feature: latestReferringParams['~feature']?.toString() ?? '',
        tags: latestReferringParams['~tags']?.toString() ?? '',
        campaign: latestReferringParams['~campaign']?.toString() ?? '',
        stage: latestReferringParams['~stage']?.toString() ?? '',
        creation_source:
          latestReferringParams['~creation_source']?.toString() ?? '',
        referring_link:
          latestReferringParams['~referring_link']?.toString() ?? '',
        id: latestReferringParams['~id']?.toString() ?? '',
        match_guaranteed:
          latestReferringParams['+match_guaranteed']?.toString() ?? '',
        referrer: latestReferringParams['+referrer']?.toString() ?? '',
        phone_number: latestReferringParams['+phone_number']?.toString() ?? '',
        is_first_session:
          latestReferringParams['+is_first_session']?.toString() ?? '',
        clicked_branch_link:
          latestReferringParams['+clicked_branch_link']?.toString() ?? '',
        click_timestamp:
          latestReferringParams['+click_timestamp']?.toString() ?? '',
        url: latestReferringParams['+url']?.toString() ?? '',
        rn_cached_initial_event:
          latestReferringParams['+rn_cached_initial_event']?.toString() ?? ''
      }
    }

    const event = new BranchEvent('app_opened', [branchUniversalObject], params)
    event
      .logEvent()
      .then(() => {
        Logger.info('branch custom event [app_opened] logged successfully')
      })
      .catch(error => {
        Logger.error('branch custom event [app_opened] logging failed', error)
      })
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
