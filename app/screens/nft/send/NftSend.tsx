import React, { useEffect } from 'react'
import { Image, ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import InputText from 'components/InputText'
import AvaButton from 'components/AvaButton'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import AddressBookLists, {
  AddressBookSource
} from 'components/addressBook/AddressBookLists'
import FlexSpacer from 'components/FlexSpacer'
import { useAddressBookLists } from 'components/addressBook/useAddressBookLists'
import { AddrBookItemType, Contact } from 'Repo'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import { useSendNFTContext } from 'contexts/SendNFTContext'
import { Opacity85 } from 'resources/Constants'
import { Account } from 'store/account'
import { NFTItemData } from 'store/nft'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { usePosthogContext } from 'contexts/PosthogContext'
import { ethersBigNumberToBN } from '@avalabs/utils-sdk'
import { SvgXml } from 'react-native-svg'

export type NftSendScreenProps = {
  onNext: () => void
  onOpenAddressBook: () => void
}

export default function NftSend({
  onNext,
  onOpenAddressBook
}: NftSendScreenProps) {
  const { theme } = useApplicationContext()
  const { capture } = usePosthogContext()
  const {
    sendToken: nft,
    toAccount,
    canSubmit,
    sdkError,
    fees
  } = useSendNFTContext()
  const activeNetwork = useSelector(selectActiveNetwork)
  const placeholder =
    activeNetwork.vmName === NetworkVMType.EVM
      ? 'Enter 0x Address'
      : 'Enter Bitcoin Address'

  const {
    saveRecentContact,
    onContactSelected: selectContact,
    reset: resetAddressBookList,
    setShowAddressBook,
    showAddressBook
  } = useAddressBookLists()

  const onNextPress = () => {
    saveRecentContact()
    onNext()
  }

  useEffect(() => {
    if (toAccount.address) {
      setShowAddressBook(false)
    }
  }, [setShowAddressBook, toAccount.address])

  function setAddress({ address, title }: { address: string; title: string }) {
    toAccount.setAddress?.(address)
    toAccount.setTitle?.(title)
  }

  const onContactSelected = (
    item: Contact | Account,
    type: AddrBookItemType,
    source: AddressBookSource
  ) => {
    switch (activeNetwork.vmName) {
      case NetworkVMType.EVM:
        setAddress({ address: item.address, title: item.title })
        break
      case NetworkVMType.BITCOIN:
        setAddress({
          address: item.addressBtc,
          title: item.title
        })
        break
    }
    selectContact(item, type)
    capture('SendContactSelected', { contactSource: source })
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { flexGrow: 1 }]}>
      <AvaText.LargeTitleBold>Send</AvaText.LargeTitleBold>
      <Space y={20} />
      <AvaText.Heading3>Send to</AvaText.Heading3>
      <View style={{ marginHorizontal: -16 }}>
        <InputText
          placeholder={placeholder}
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
          <AvaText.Heading3>Collectible</AvaText.Heading3>
          <CollectibleItem nft={nft} />
          <Space y={8} />
          <NetworkFeeSelector
            gasLimit={fees.gasLimit ?? 0}
            onChange={(gasLimit, gasPrice1, feePreset) => {
              fees.setGasLimit(gasLimit)
              fees.setCustomGasPrice(ethersBigNumberToBN(gasPrice1))
              fees.setSelectedFeePreset(feePreset)
            }}
          />
          <Space y={8} />
          <AvaText.Body3 textStyle={{ color: theme.colorError }}>
            {sdkError ?? ''}
          </AvaText.Body3>
          <Space y={8} />
          <FlexSpacer />
        </>
      )}
      <AvaButton.PrimaryLarge
        disabled={!toAccount.address || !canSubmit}
        onPress={onNextPress}
        style={{ marginBottom: 16 }}>
        Next
      </AvaButton.PrimaryLarge>
    </ScrollView>
  )
}

const CollectibleItem = ({ nft }: { nft: NFTItemData }) => {
  const { theme } = useApplicationContext()
  return (
    <View
      style={[
        styles.collectibleItem,
        {
          backgroundColor: theme.colorBg2 + Opacity85
        }
      ]}>
      <Row>
        {nft.isSvg ? (
          <View style={{ alignItems: 'center' }}>
            <SvgXml xml={nft.image} width={80} height={80 * nft.aspect} />
          </View>
        ) : (
          <Image
            style={styles.nftImage}
            source={{ uri: nft.image }}
            width={80}
            height={80}
          />
        )}
        <Space x={16} />
        <AvaText.Body2 textStyle={{ flex: 1 }}>{nft.name}</AvaText.Body2>
      </Row>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flex: 1
  },
  collectibleItem: {
    marginVertical: 4,
    borderRadius: 8,
    padding: 16
  },
  nftImage: {
    borderRadius: 8
  }
})
