import React, { FC, useCallback, useEffect, useState } from 'react'
import { Modal, ScrollView, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import InputText from 'components/InputText'
import TokenSelectAndAmount from 'components/TokenSelectAndAmount'
import AvaButton from 'components/AvaButton'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import FlexSpacer from 'components/FlexSpacer'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSendTokenContext } from 'contexts/SendTokenContext'
import numeral from 'numeral'
import { AddrBookItemType, Contact } from 'Repo'
import AddressBookLists, {
  AddressBookSource
} from 'components/addressBook/AddressBookLists'
import { Account } from 'store/account'
import { useAddressBookLists } from 'components/addressBook/useAddressBookLists'
import QrScannerAva from 'components/QrScannerAva'
import QRScanSVG from 'components/svg/QRScanSVG'
import { TokenWithBalance } from 'store/balance'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { NetworkVMType } from '@avalabs/chains-sdk'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { Row } from 'components/Row'
import { usePosthogContext } from 'contexts/PosthogContext'
import { ethersBigNumberToBN } from '@avalabs/utils-sdk'

type Props = {
  onNext: () => void
  onOpenAddressBook: () => void
  onOpenSelectToken: (
    onTokenSelected: (token: TokenWithBalance) => void
  ) => void
  token?: TokenWithBalance
  contact?: Contact
}

const SendToken: FC<Props> = ({
  onNext,
  onOpenAddressBook,
  onOpenSelectToken,
  token,
  contact
}) => {
  const { theme } = useApplicationContext()
  const { capture } = usePosthogContext()
  const {
    setSendToken,
    sendToken,
    setSendAmount,
    sendAmountInCurrency,
    sendAmount,
    toAccount,
    fees,
    canSubmit,
    sdkError,
    maxAmount
  } = useSendTokenContext()
  const activeNetwork = useSelector(selectActiveNetwork)
  const [showQrCamera, setShowQrCamera] = useState(false)
  const placeholder =
    activeNetwork.vmName === NetworkVMType.EVM
      ? 'Enter 0x Address'
      : 'Enter Bitcoin Address'

  const balance = numeral(sendToken?.balanceDisplayValue ?? 0).value() || 0
  const setAddress = useCallback(
    ({ address, title }: { address: string; title: string }) => {
      toAccount.setAddress?.(address)
      toAccount.setTitle?.(title)
    },
    [toAccount]
  )

  const {
    showAddressBook,
    setShowAddressBook,
    onContactSelected: selectContact,
    saveRecentContact,
    reset: resetAddressBookList
  } = useAddressBookLists()

  useEffect(() => {
    if (token) {
      setSendToken(token)
    }
  }, [setSendToken, token])

  useEffect(() => {
    if (contact) {
      setAddress(contact)
    }
  }, [contact, setAddress])

  useEffect(() => {
    if (toAccount.address) {
      setShowAddressBook(false)
    }
  }, [setShowAddressBook, toAccount.address])

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

  const onNextPress = () => {
    saveRecentContact()
    onNext()
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Send
      </AvaText.LargeTitleBold>
      <Space y={20} />
      <AvaText.Heading3 textStyle={{ marginHorizontal: 16 }}>
        Send to
      </AvaText.Heading3>
      <Space y={4} />
      <View style={[{ flex: 0, paddingStart: 4, paddingEnd: 4 }]}>
        <InputText
          placeholder={placeholder}
          multiline={true}
          onChangeText={text => {
            toAccount.setTitle?.('Address')
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
        {!toAccount.address && (
          <View
            style={{
              position: 'absolute',
              right: 64,
              justifyContent: 'center',
              height: '100%'
            }}>
            <AvaButton.Icon onPress={() => setShowQrCamera(true)}>
              <QRScanSVG />
            </AvaButton.Icon>
          </View>
        )}
      </View>
      <Space y={24} />
      {showAddressBook ? (
        <AddressBookLists
          onlyBtc={activeNetwork.vmName === NetworkVMType.BITCOIN}
          onContactSelected={onContactSelected}
          navigateToAddressBook={onOpenAddressBook}
        />
      ) : (
        <>
          <View style={{ paddingHorizontal: 16 }}>
            <Row
              style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <AvaText.Heading3>{'Token'}</AvaText.Heading3>
              <AvaText.Body3>{`Balance: ${balance} ${
                sendToken?.symbol ?? ''
              }`}</AvaText.Body3>
            </Row>
            <TokenSelectAndAmount
              selectedToken={sendToken}
              amount={sendAmount.toString()}
              maxEnabled={!!toAccount.address && !!sendToken}
              onAmountSet={amount => setSendAmount(amount)}
              onOpenSelectToken={() => onOpenSelectToken(setSendToken)}
              getMaxAmount={() => maxAmount}
            />
            <Space y={4} />
            <Row style={{ justifyContent: 'flex-end' }}>
              <AvaText.Body3 currency>{sendAmountInCurrency}</AvaText.Body3>
            </Row>
            <Space y={8} />
            <AvaText.Body3 textStyle={{ color: theme.colorError }}>
              {sdkError ?? ''}
            </AvaText.Body3>
            <Space y={8} />
            <NetworkFeeSelector
              gasLimit={fees.gasLimit ?? 0}
              onChange={(gasLimit, gasPrice1, feePreset) => {
                fees.setGasLimit(gasLimit)
                fees.setCustomGasPrice(ethersBigNumberToBN(gasPrice1))
                fees.setSelectedFeePreset(feePreset)
              }}
            />
            <AvaText.Body3
              currency
              textStyle={{ marginTop: 4, alignSelf: 'flex-end' }}>
              {fees.sendFeeInCurrency}
            </AvaText.Body3>
          </View>
          <FlexSpacer />
        </>
      )}
      <AvaButton.PrimaryLarge
        disabled={!canSubmit}
        onPress={onNextPress}
        style={{ margin: 16 }}>
        Next
      </AvaButton.PrimaryLarge>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQrCamera(false)}
        visible={showQrCamera}>
        <QrScannerAva
          onSuccess={data => {
            setAddress({ address: data, title: '' })
            setShowQrCamera(false)
          }}
          onCancel={() => setShowQrCamera(false)}
        />
      </Modal>
    </ScrollView>
  )
}

export default SendToken
