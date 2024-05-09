import React, { useEffect } from 'react'
import { Image, ScrollView, StyleSheet, View } from 'react-native'
import { Text, Button } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import InputText from 'components/InputText'
import AvaButton from 'components/AvaButton'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import AddressBookLists, {
  AddressBookSource
} from 'components/addressBook/AddressBookLists'
import FlexSpacer from 'components/FlexSpacer'
import { useAddressBookLists } from 'components/addressBook/useAddressBookLists'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import { useSendNFTContext } from 'contexts/SendNFTContext'
import { Account } from 'store/account'
import { NFTItem } from 'store/nft'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { SvgXml } from 'react-native-svg'
import { AddrBookItemType } from 'store/addressBook'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { Contact } from '@avalabs/types'
import { getAddressProperty } from 'store/utils/account&contactGetters'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { NFTDetailsSendScreenProps } from 'navigation/types'

type NftSendScreenProps = {
  onOpenAddressBook: () => void
}

type NftSendNavigationProp = NFTDetailsSendScreenProps<
  typeof AppNavigation.NftSend.AddressPick
>['navigation']

export default function NftSend({
  onOpenAddressBook
}: NftSendScreenProps): JSX.Element {
  const navigation = useNavigation<NftSendNavigationProp>()
  const {
    sendToken: nft,
    toAccount,
    canSubmit,
    onSendNow,
    sendStatus,
    sdkError
  } = useSendNFTContext()
  const { activeNetwork } = useNetworks()

  const sendInProcess = sendStatus === 'Sending'
  const sendDisabled = !canSubmit || !toAccount.address || !!sdkError

  const {
    saveRecentContact,
    onContactSelected: selectContact,
    reset: resetAddressBookList,
    setShowAddressBook,
    showAddressBook
  } = useAddressBookLists()

  const onNextPress = (): void => {
    saveRecentContact()
    onSendNow()
  }

  useEffect(() => {
    if (toAccount.address) {
      setShowAddressBook(false)
    }
  }, [setShowAddressBook, toAccount.address])

  useEffect(() => {
    if (sendStatus === 'Success') {
      // go back to Portfolio - Collectibles screen
      navigation.navigate(AppNavigation.Wallet.Drawer, {
        screen: AppNavigation.Wallet.Tabs,
        params: {
          screen: AppNavigation.Tabs.Portfolio,
          params: {}
        }
      })
    }
  }, [navigation, sendStatus])

  function setAddress({
    address,
    title
  }: {
    address: string
    title: string
  }): void {
    toAccount.setAddress?.(address)
    toAccount.setTitle?.(title)
  }

  const onContactSelected = (
    item: Contact | Account,
    type: AddrBookItemType,
    source: AddressBookSource
  ): void => {
    switch (activeNetwork.vmName) {
      case NetworkVMType.EVM:
        setAddress({ address: getAddressProperty(item), title: item.name })
        break
      case NetworkVMType.BITCOIN:
        setAddress({
          address: item.addressBTC ?? '',
          title: item.name
        })
        break
    }
    selectContact(item, type)
    AnalyticsService.capture('NftSendContactSelected', {
      contactSource: source
    })
  }

  return (
    <ScrollView contentContainerStyle={[styles.container]}>
      <Text variant="heading3">Send</Text>
      <Space y={20} />
      <Text variant="heading6">Send To</Text>
      <View style={{ marginHorizontal: -16 }}>
        <InputText
          placeholder={'Enter 0x Address'}
          multiline={true}
          onChangeText={text => {
            toAccount.setAddress?.(text)
            resetAddressBookList()
          }}
          text={toAccount.address}
        />
        {!toAccount.address && (
          <View
            style={{
              position: 'absolute',
              right: 24,
              justifyContent: 'center',
              height: '100%'
            }}>
            <AvaButton.Icon
              onPress={() => setShowAddressBook(!showAddressBook)}>
              <AddressBookSVG />
            </AvaButton.Icon>
          </View>
        )}
      </View>
      {showAddressBook ? (
        <View style={{ marginHorizontal: -16, flex: 1 }}>
          <AddressBookLists
            onContactSelected={onContactSelected}
            navigateToAddressBook={onOpenAddressBook}
          />
        </View>
      ) : (
        <>
          <Text variant="heading6">Collectible</Text>
          <CollectibleItem nft={nft} />
          <Text variant="body1" sx={{ color: '$dangerMain' }}>
            {sdkError ?? ''}
          </Text>
          <FlexSpacer />
        </>
      )}
      <Button
        type="primary"
        size="xlarge"
        onPress={onNextPress}
        disabled={sendInProcess || sendDisabled}
        style={{ marginBottom: 16 }}>
        Next
      </Button>
    </ScrollView>
  )
}

const CollectibleItem = ({ nft }: { nft: NFTItem }): JSX.Element => {
  const { theme } = useApplicationContext()

  return (
    <View
      style={[
        styles.collectibleItem,
        {
          backgroundColor: theme.colorBg2
        }
      ]}>
      <Row>
        <View style={{ borderRadius: 8 }}>
          {nft.imageData?.isSvg ? (
            <View style={{ alignItems: 'center' }}>
              <SvgXml
                xml={nft.imageData.image ?? null}
                width={80}
                height={80 * nft.imageData.aspect ?? 1}
              />
            </View>
          ) : (
            <Image
              style={styles.nftImage}
              source={{ uri: nft.imageData?.image }}
              width={80}
              height={80}
            />
          )}
        </View>
        <Space x={16} />
        <View style={{ flex: 1 }}>
          <Text
            variant="heading5"
            testID="NftTokenID"
            numberOfLines={1}
            ellipsizeMode="tail">
            #{nft.tokenId}
          </Text>
          <Text
            variant="heading6"
            testID="NftTokenName"
            numberOfLines={1}
            ellipsizeMode="tail">
            {nft.processedMetadata.name}
          </Text>
        </View>
      </Row>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    minHeight: '100%'
  },
  collectibleItem: {
    marginVertical: 16,
    borderRadius: 8,
    padding: 16
  },
  nftImage: {
    borderRadius: 8
  }
})
