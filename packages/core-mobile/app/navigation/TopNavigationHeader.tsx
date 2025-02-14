import React, { FC } from 'react'
import { View } from 'react-native'
import AvaButton from 'components/AvaButton'
import { useNavigation } from '@react-navigation/native'
import MenuSVG from 'components/svg/MenuSVG'
import AppNavigation from 'navigation/AppNavigation'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import { DrawerScreenProps } from 'navigation/types'
import NetworkDropdown from 'screens/network/NetworkDropdown'
import TokenAddress from 'components/TokenAddress'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import CarrotSVG from 'components/svg/CarrotSVG'
import { Row } from 'components/Row'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getAddressByNetwork } from 'store/account/utils'

type Props = {
  showAddress?: boolean
  showBackButton?: boolean
  showAccountSelector?: boolean
  showNetworkSelector?: boolean
  showMenu?: boolean
  testID?: string
  onBack?: () => void
}

type NavigationProp = DrawerScreenProps<
  typeof AppNavigation.Wallet.Tabs
>['navigation']

const TopNavigationHeader: FC<Props> = ({
  showAddress = false,
  showAccountSelector = true,
  showNetworkSelector = true,
  showBackButton = false,
  showMenu = true,
  onBack
}) => {
  const { activeNetwork } = useNetworks()
  const { theme } = useApplicationContext()
  const navigation = useNavigation<NavigationProp>()
  const activeAccount = useSelector(selectActiveAccount)

  const address = activeAccount
    ? getAddressByNetwork(activeAccount, activeNetwork)
    : ''

  const renderAddress: () => null | JSX.Element = () => {
    if (!showAddress) return null

    return (
      <View
        style={{
          flexDirection: 'row',
          alignSelf: 'center'
        }}>
        <TokenAddress address={address ?? ''} textColor={theme.colorText2} />
      </View>
    )
  }

  const renderLeftButton: () => JSX.Element | null = () => {
    if (showBackButton) {
      const handleOnBack: () => void = () => {
        if (onBack) {
          onBack()
        } else {
          navigation.goBack()
        }
      }

      return (
        <AvaButton.Icon
          onPress={handleOnBack}
          style={{
            paddingLeft: -5,
            paddingRight: 48,
            paddingVertical: 1.5
          }}>
          <CarrotSVG direction="left" size={24} />
        </AvaButton.Icon>
      )
    } else if (showMenu) {
      return (
        <AvaButton.Icon
          onPress={navigation.openDrawer}
          style={{ marginRight: 32 }}>
          <MenuSVG />
        </AvaButton.Icon>
      )
    }
    return null
  }

  const renderAccountSelector: () => JSX.Element = () => (
    <View
      style={{
        zIndex: 10000,
        flex: 1,
        alignItems: 'center'
      }}>
      <HeaderAccountSelector
        direction="down"
        onPressed={() =>
          navigation.navigate(AppNavigation.Modal.AccountDropDown)
        }
      />
    </View>
  )

  return (
    <View>
      <Row
        style={{
          paddingLeft: 8,
          paddingRight: 16,
          alignItems: 'center',
          justifyContent: 'space-between' //for this to work we need to add empty views if necessary
        }}>
        {renderLeftButton() || <View />}
        {showAccountSelector && renderAccountSelector()}
        {(showNetworkSelector && <NetworkDropdown />) || (
          <View style={{ height: 34, width: 64 }} />
        )}
      </Row>
      {renderAddress()}
    </View>
  )
}

export default TopNavigationHeader
