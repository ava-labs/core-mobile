import { NavigatorScreenParams, useNavigation } from '@react-navigation/native'
import DrawerView from 'screens/drawer/DrawerView'
import AppNavigation from 'navigation/AppNavigation'
import TabNavigator, {
  TabNavigatorParamList
} from 'navigation/wallet/TabNavigator'
import React, { FC, useMemo, useState } from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { useApplicationContext } from 'contexts/ApplicationContext'
import FloatingActionButton from 'components/fab/FloatingActionButton'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { Pressable, View, ViewStyle } from 'react-native'
import ArrowSVG from 'components/svg/ArrowSVG'
import QRCodeSVG from 'components/svg/QRCodeSVG'
import BuySVG from 'components/svg/BuySVG'
import SwapSVG from 'components/svg/SwapSVG'
import WalletConnectSVG from 'components/svg/WalletConnectSVG'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { DrawerScreenProps } from 'navigation/types'
import AddSVG from 'components/svg/AddSVG'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import BridgeSVG from 'components/svg/BridgeSVG'
import { Opacity50 } from 'resources/Constants'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { selectIsLeftHanded } from 'store/settings/advanced'
import { ActionProp } from 'components/fab/types'

export type DrawerParamList = {
  [AppNavigation.Wallet.Tabs]: NavigatorScreenParams<TabNavigatorParamList>
  [AppNavigation.Tabs.Fab]: undefined
}

const DrawerStack = createDrawerNavigator()

const DrawerContent = () => <DrawerView />

const DrawerScreenStack = () => (
  <DrawerStack.Navigator
    screenOptions={{
      headerShown: false,
      drawerStyle: { width: '80%' }
    }}
    drawerContent={DrawerContent}>
    <DrawerStack.Screen
      name={AppNavigation.Wallet.Tabs}
      component={TabNavigatorWithFab}
    />
  </DrawerStack.Navigator>
)

const TabNavigatorWithFab = () => {
  return (
    <>
      <TabNavigator />
      <Fab />
    </>
  )
}

type FabNavigationProp = DrawerScreenProps<
  typeof AppNavigation.Tabs.Fab
>['navigation']

const Fab: FC = () => {
  const swapDisabled = useIsUIDisabled(UI.Swap)
  const buyDisabled = useIsUIDisabled(UI.Buy)
  const wcDisabled = useIsUIDisabled(UI.WalletConnect)
  const isBridgeDisabled = useIsUIDisabled(UI.Bridge)
  const { theme } = useApplicationContext()
  const navigation = useNavigation<FabNavigationProp>()
  const { setPendingDeepLink } = useDeeplink()
  const activeNetwork = useSelector(selectActiveNetwork)
  const [expanded, setExpanded] = useState(false)
  const { capture } = usePostCapture()
  const isLeftHanded = useSelector(selectIsLeftHanded)

  const actionItems = useMemo(() => {
    const actions: Record<string, ActionProp> = {}

    actions.Send = {
      image: (
        <View
          testID="tab_navigator__send_button"
          style={{
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <ArrowSVG rotate={180} color={theme.background} size={17} />
        </View>
      ),
      onPress: () => {
        navigation.navigate(AppNavigation.Wallet.SendTokens)
        capture('FABItemSelected_Send')
      }
    } as ActionProp
    actions.Receive = {
      image: <QRCodeSVG color={theme.background} size={24} />,
      onPress: () => {
        navigation.navigate(AppNavigation.Wallet.ReceiveTokens)
        capture('FABItemSelected_Receive')
      }
    } as ActionProp
    if (!buyDisabled) {
      actions.Buy = {
        image: <BuySVG color={theme.background} size={24} />,
        onPress: () => {
          navigation.navigate(AppNavigation.Wallet.Buy)
          capture('FABItemSelected_Buy')
        }
      } as ActionProp
    }
    if (!swapDisabled) {
      actions.Swap = {
        image: <SwapSVG color={theme.background} size={24} />,
        onPress: () => {
          navigation.navigate(AppNavigation.Wallet.Swap)
          capture('FABItemSelected_Swap')
        }
      } as ActionProp
    }
    if (!wcDisabled) {
      actions.WalletConnect = {
        image: <WalletConnectSVG color={theme.background} size={24} />,
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
      image: <BridgeSVG color={theme.background} size={24} />,
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
    theme.background,
    wcDisabled,
    swapDisabled,
    buyDisabled,
    isBridgeDisabled,
    activeNetwork.chainName,
    navigation,
    capture,
    setPendingDeepLink
  ])

  function dismiss() {
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
      backgroundColor: expanded ? theme.colorBg1 + Opacity50 : theme.transparent
    } as ViewStyle
  }, [expanded, isLeftHanded, theme.colorBg1, theme.transparent])

  return (
    <Pressable
      pointerEvents={expanded ? 'auto' : 'box-none'}
      onPress={dismiss}
      style={fabStyle}>
      <FloatingActionButton
        isLeftHanded={isLeftHanded}
        setExpanded={setExpanded}
        expanded={expanded}
        actionItems={actionItems}
        size={56}
        icon={<AddSVG color={theme.colorBg2} size={28} hideCircle />}
      />
    </Pressable>
  )
}

export default React.memo(DrawerScreenStack)
