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
import { selectActiveNetwork } from 'store/network'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { selectActiveAccount } from 'store/account'
import CarrotSVG from 'components/svg/CarrotSVG'
import { Row } from 'components/Row'

type Props = {
  showAddress?: boolean
  showBackButton?: boolean
  testID?: string
}

type NavigationProp = DrawerScreenProps<
  typeof AppNavigation.Wallet.Tabs
>['navigation']

const TopNavigationHeader: FC<Props> = ({
  showAddress = false,
  showBackButton = false
}) => {
  const { theme } = useApplicationContext()
  const navigation = useNavigation<NavigationProp>()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const address =
    activeNetwork.vmName === NetworkVMType.BITCOIN
      ? activeAccount?.addressBtc
      : activeAccount?.address

  const renderAddress = () => {
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

  const renderLeftButton = () => {
    if (showBackButton) {
      return (
        <AvaButton.Icon
          onPress={navigation.goBack}
          style={{
            paddingLeft: -5,
            paddingRight: 48,
            paddingVertical: 1.5
          }}>
          <CarrotSVG direction="left" size={24} />
        </AvaButton.Icon>
      )
    }

    return (
      <AvaButton.Icon
        onPress={navigation.openDrawer}
        style={{ marginRight: 32 }}>
        <MenuSVG />
      </AvaButton.Icon>
    )
  }
  return (
    <View>
      <Row
        style={{
          paddingLeft: 8,
          paddingRight: 16,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        {renderLeftButton()}
        <View
          style={{
            zIndex: 1,
            flex: 1,
            maxWidth: 200,
            alignItems: 'center'
          }}>
          <HeaderAccountSelector
            direction="down"
            onPressed={() =>
              navigation.navigate(AppNavigation.Modal.AccountDropDown)
            }
          />
        </View>
        <NetworkDropdown />
      </Row>
      {renderAddress()}
    </View>
  )
}

export default TopNavigationHeader
