import { Action } from '@reduxjs/toolkit'
import { onLogOut, onRehydrationComplete } from 'store/app'
import { selectDistinctID } from 'store/posthog'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import Branch from 'react-native-branch'

export const addBranchListeners = (startListening: AppStartListening): void => {
  const branchIdentifyUser = async (
    _: Action,
    listenerApi: AppListenerEffectAPI
  ): Promise<void> => {
    const distinctId = selectDistinctID(listenerApi.getState())
    Branch.setIdentity(distinctId)
    Branch.setRequestMetadata('posthog_distinct_id', distinctId)
    Branch.subscribe({
      onOpenStart: ({ uri, cachedInitialEvent }) => {
        console.log(
          'subscribe onOpenStart, will open ' +
            uri +
            ' cachedInitialEvent is ' +
            cachedInitialEvent
        )
      },
      onOpenComplete: ({ error, params, uri }) => {
        if (error) {
          console.log(
            'subscribe onOpenComplete, Error from opening uri: ' +
              uri +
              ' error: ' +
              error
          )
        } else if (params) {
          if (!params['+clicked_branch_link']) {
            if (params['+non_branch_link']) {
              console.log('non_branch_link: ' + uri)
              // Route based on non-Branch links
              return
            }
          } else {
            // Handle params
            let deepLinkPath = params.$deeplink_path as string
            let canonicalUrl = params.$canonical_url as string
            // Route based on Branch link data
            return
          }
        }
      }
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
}
