import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { PortfolioScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useDispatch, useSelector } from 'react-redux'
import { setViewOnce, ViewOnceKey } from 'store/viewOnce'
import { setActive, toggleFavorite } from 'store/network'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

type ScreenProps = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.AddPChainPrompt
>

export const PChainFavoriteModal = (): JSX.Element => {
  const { goBack, canGoBack } = useNavigation<ScreenProps['navigation']>()
  const dispatch = useDispatch()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  dispatch(setViewOnce(ViewOnceKey.P_CHAIN_FAVORITE))

  const onAction = useCallback(async () => {
    const pChainNetwork = NetworkService.getAvalancheNetworkP(isDeveloperMode)
    dispatch(toggleFavorite(pChainNetwork.chainId))
    dispatch(setActive(pChainNetwork.chainId))
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, dispatch, goBack, isDeveloperMode])

  const onDismiss = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

  return (
    <WarningModal
      testID="add_p_chain_favorite_modal"
      title={'Add Avalanche P-Chain balance to your Portfolio?'}
      message={'Add it to your portfolio to view your balance and activity.'}
      actionText={'Yes'}
      dismissText={'No'}
      onAction={onAction}
      onDismiss={onDismiss}
    />
  )
}
