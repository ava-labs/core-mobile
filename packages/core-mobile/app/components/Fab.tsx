import { useNavigation } from '@react-navigation/native'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { useAnalytics } from 'hooks/useAnalytics'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import AppNavigation from 'navigation/AppNavigation'
import { TabsScreenProps } from 'navigation/types'
import React, { FC, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectIsLeftHanded } from 'store/settings/advanced'
import { Pressable, SxProp, View, alpha, useTheme } from '@avalabs/k2-mobile'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { ActionProp } from './fab/types'
import ArrowSVG from './svg/ArrowSVG'
import QRCodeSVG from './svg/QRCodeSVG'
import BuySVG from './svg/BuySVG'
import SwapSVG from './svg/SwapSVG'
import WalletConnectSVG from './svg/WalletConnectSVG'
import BridgeSVG from './svg/BridgeSVG'
import { showSnackBarCustom } from './Snackbar'
import GeneralToast from './toast/GeneralToast'
import FloatingActionButton from './fab/FloatingActionButton'
import AddSVG from './svg/AddSVG'

type FabNavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Fab
>['navigation']

export const Fab: FC = () => {
  const swapDisabled = useIsUIDisabled(UI.Swap)
  const buyDisabled = useIsUIDisabled(UI.Buy)
  const wcDisabled = useIsUIDisabled(UI.WalletConnect)
  const isBridgeDisabled = useIsUIDisabled(UI.Bridge)
  const navigation = useNavigation<FabNavigationProp>()
  const { setPendingDeepLink } = useDeeplink()
  const activeNetwork = useSelector(selectActiveNetwork)
  const [expanded, setExpanded] = useState(false)
  const { capture } = useAnalytics()
  const isLeftHanded = useSelector(selectIsLeftHanded)
  const {
    theme: { colors }
  } = useTheme()

  const actionItems = useMemo(() => {
    const actions: Record<string, ActionProp> = {}

    actions.Send = {
      image: (
        <View
          testID="tab_navigator__send_button"
          sx={{
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <ArrowSVG rotate={180} color={colors.$black} size={17} />
        </View>
      ),
      onPress: () => {
        navigation.navigate(AppNavigation.Wallet.SendTokens)
        capture('FABItemSelected_Send')
      }
    } as ActionProp
    actions.Receive = {
      image: (
        <View
          testID="tab_navigator__receive_button"
          sx={{
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <QRCodeSVG color={colors.$black} size={24} />
        </View>
      ),
      onPress: () => {
        navigation.navigate(AppNavigation.Wallet.ReceiveTokens)
        capture('FABItemSelected_Receive')
      }
    } as ActionProp
    if (!buyDisabled) {
      actions.Buy = {
        image: (
          <View
            testID="tab_navigator__buy_button"
            sx={{
              width: 24,
              height: 24,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <BuySVG color={colors.$black} size={24} />
          </View>
        ),
        onPress: () => {
          navigation.navigate(AppNavigation.Wallet.Buy)
          capture('FABItemSelected_Buy')
        }
      } as ActionProp
    }
    if (!swapDisabled) {
      actions.Swap = {
        image: (
          <View
            testID="tab_navigator__swap_button"
            sx={{
              width: 24,
              height: 24,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <SwapSVG color={colors.$black} size={24} />
          </View>
        ),
        onPress: () => {
          navigation.navigate(AppNavigation.Wallet.Swap)
          capture('FABItemSelected_Swap')
        }
      } as ActionProp
    }
    if (!wcDisabled) {
      actions.WalletConnect = {
        image: <WalletConnectSVG color={colors.$black} size={24} />,
        onPress: () => {
          navigation.navigate(AppNavigation.Wallet.QRCode, {
            onScanned: uri => {
              setPendingDeepLink({
                url: uri,
                origin: DeepLinkOrigin.ORIGIN_QR_CODE
              })
              navigation.goBack()
            }
          })
          capture('FABItemSelected_WalletConnect')
        }
      } as ActionProp
    }
    actions.Bridge = {
      image: (
        <View testID="tab_navigator__bridge_button">
          <BridgeSVG color={colors.$black} size={24} />
        </View>
      ),
      onPress: () => {
        if (isBridgeDisabled) {
          showSnackBarCustom({
            component: (
              <GeneralToast
                message={`Bridge not available on ${activeNetwork.chainName}`}
              />
            ),
            duration: 'short'
          })
        } else {
          navigation.navigate(AppNavigation.Wallet.Bridge)
          capture('FABItemSelected_Bridge')
        }
      }
    } as ActionProp

    return actions
  }, [
    buyDisabled,
    swapDisabled,
    wcDisabled,
    colors.$black,
    navigation,
    capture,
    setPendingDeepLink,
    isBridgeDisabled,
    activeNetwork.chainName
  ])

  function dismiss(): void {
    setExpanded(false)
    capture('FABClosed')
  }

  const fabStyle = useMemo(() => {
    return {
      position: 'absolute',
      width: '100%',
      height: '100%',
      justifyContent: 'flex-end',
      alignItems: isLeftHanded ? 'flex-start' : 'flex-end',
      paddingBottom: 60,
      backgroundColor: expanded
        ? alpha(colors.$black, 0.5)
        : colors.$transparent
    } as SxProp
  }, [colors.$black, colors.$transparent, expanded, isLeftHanded])

  return (
    <Pressable
      pointerEvents={expanded ? 'auto' : 'box-none'}
      onPress={dismiss}
      sx={fabStyle}>
      <FloatingActionButton
        isLeftHanded={isLeftHanded}
        setExpanded={setExpanded}
        expanded={expanded}
        actionItems={actionItems}
        size={56}
        icon={
          <AddSVG
            color={colors.$neutral900}
            size={28}
            hideCircle
            testID="add_svg"
          />
        }
      />
    </Pressable>
  )
}
