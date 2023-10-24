import React, { useCallback, useEffect } from 'react'
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
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Row } from 'components/Row'
import { useSendNFTContext } from 'contexts/SendNFTContext'
import { Account } from 'store/account'
import { NFTItemData } from 'store/nft'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { SvgXml } from 'react-native-svg'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { BN } from 'bn.js'
import { AddrBookItemType, Contact } from 'store/addressBook'

export type NftSendScreenProps = {
  onNext: () => void
  onOpenAddressBook: () => void
}

export default function NftSend({
  onNext,
  onOpenAddressBook
}: NftSendScreenProps) {
  const { theme } = useApplicationContext()
  const { capture } = usePostCapture()
  const {
    sendToken: nft,
    toAccount,
    canSubmit,
    sdkError,
    fees: {
      setCustomGasPrice,
      setSelectedFeePreset,
      setCustomGasLimit,
      gasLimit,
      selectedFeePreset
    }
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
    capture('NftSendContactSelected', {
      contactSource: source
    })
  }

  const handleGasPriceChange = useCallback(
    (gasPrice1, feePreset) => {
      if (feePreset !== selectedFeePreset) {
        capture('NftSendFeeOptionChanged', {
          modifier: feePreset
        })
      }
      setCustomGasPrice(new BN(gasPrice1.toString()))
      setSelectedFeePreset(feePreset)
    },
    [setCustomGasPrice, setSelectedFeePreset, selectedFeePreset, capture]
  )

  const handleGasLimitChange = useCallback(
    customGasLimit => {
      setCustomGasLimit(customGasLimit)
    },
    [setCustomGasLimit]
  )

  return (
    <ScrollView contentContainerStyle={[styles.container]}>
      <AvaText.LargeTitleBold>Send</AvaText.LargeTitleBold>
      <Space y={20} />
      <AvaText.Heading3>Send To</AvaText.Heading3>
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
          <NetworkFeeSelector
            gasLimit={gasLimit ?? 0}
            onGasPriceChange={handleGasPriceChange}
            onGasLimitChange={handleGasLimitChange}
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
          backgroundColor: theme.colorBg2
        }
      ]}>
      <Row>
        <View style={{ borderRadius: 8 }}>
          {nft.isSvg ? (
            <View style={{ alignItems: 'center' }}>
              <SvgXml
                xml={nft.metadata.imageUri ?? null}
                width={80}
                height={80 * nft.aspect}
              />
            </View>
          ) : (
            <Image
              style={styles.nftImage}
              source={{ uri: nft.metadata.imageUri }}
              width={80}
              height={80}
            />
          )}
        </View>
        <Space x={16} />
        <View style={{ flex: 1 }}>
          <AvaText.Heading5
            testID="NftTokenID"
            numberOfLines={1}
            ellipsizeMode="tail">
            #{nft.tokenId}
          </AvaText.Heading5>
          <AvaText.Heading6
            testID="NftTokenName"
            numberOfLines={1}
            ellipsizeMode="tail">
            {nft.metadata.name}
          </AvaText.Heading6>
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
