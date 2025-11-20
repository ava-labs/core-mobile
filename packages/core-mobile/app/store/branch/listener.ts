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

  // eslint-disable-next-line sonarjs/cognitive-complexity
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
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ): Record<string, string> | undefined => {
    if (params['+clicked_branch_link'] === true) {
      return {
        posthog_distinct_id: distinctId,
        utm_source: params['utm_source']?.toString() ?? '',
        utm_campaign: params['utm_campaign']?.toString() ?? '',
        utm_medium: params['utm_medium']?.toString() ?? '',
        gclid: params['gclid']?.toString() ?? '',
        channel: params['~channel']?.toString() ?? '',
        feature: params['~feature']?.toString() ?? '',
        tags: params['~tags']?.toString() ?? '',
        campaign: params['~campaign']?.toString() ?? '',
        stage: params['~stage']?.toString() ?? '',
        creation_source: params['~creation_source']?.toString() ?? '',
        referring_link: params['~referring_link']?.toString() ?? '',
        id: params['~id']?.toString() ?? '',
        match_guaranteed: params['+match_guaranteed']?.toString() ?? '',
        referrer: params['+referrer']?.toString() ?? '',
        phone_number: params['+phone_number']?.toString() ?? '',
        is_first_session: params['+is_first_session']?.toString() ?? '',
        clicked_branch_link: params['+clicked_branch_link']?.toString() ?? '',
        click_timestamp: params['+click_timestamp']?.toString() ?? '',
        url: params['+url']?.toString() ?? '',
        rn_cached_initial_event:
          params['+rn_cached_initial_event']?.toString() ?? ''
      }
    }

    const url = params['+non_branch_link']
      ? new URL(params['+non_branch_link'] as string)
      : undefined
    if (url) {
      return {
        posthog_distinct_id: distinctId,
        utm_source: url.searchParams.get('utm_source') ?? '',
        utm_campaign: url.searchParams.get('utm_campaign') ?? '',
        utm_medium: url.searchParams.get('utm_medium') ?? '',
        gclid: url.searchParams.get('gclid') ?? '',
        channel: url.searchParams.get('channel') ?? '',
        feature: url.searchParams.get('feature') ?? '',
        tags: url.searchParams.get('tags') ?? '',
        campaign: url.searchParams.get('campaign') ?? '',
        stage: url.searchParams.get('stage') ?? '',
        creation_source: url.searchParams.get('creation_source') ?? '',
        referring_link: url.searchParams.get('referring_link') ?? '',
        id: url.searchParams.get('id') ?? '',
        match_guaranteed: url.searchParams.get('match_guaranteed') ?? '',
        referrer: url.searchParams.get('referrer') ?? '',
        phone_number: url.searchParams.get('phone_number') ?? '',
        is_first_session: url.searchParams.get('is_first_session') ?? '',
        clicked_branch_link: url.searchParams.get('clicked_branch_link') ?? '',
        click_timestamp: url.searchParams.get('click_timestamp') ?? '',
        url: url.searchParams.get('url') ?? '',
        rn_cached_initial_event:
          url.searchParams.get('rn_cached_initial_event') ?? ''
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
