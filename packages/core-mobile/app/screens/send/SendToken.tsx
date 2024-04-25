import React, { FC, useCallback, useEffect, useState } from 'react'
import { Modal, ScrollView, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import InputText from 'components/InputText'
import AvaButton from 'components/AvaButton'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import FlexSpacer from 'components/FlexSpacer'
import { useSendTokenContext } from 'contexts/SendTokenContext'
import AddressBookLists, {
  AddressBookSource
} from 'components/addressBook/AddressBookLists'
import { Account } from 'store/account'
import { useAddressBookLists } from 'components/addressBook/useAddressBookLists'
import QrScannerAva from 'components/QrScannerAva'
import QRScanSVG from 'components/svg/QRScanSVG'
import { TokenWithBalance } from 'store/balance'
import { NetworkVMType } from '@avalabs/chains-sdk'
import UniversalTokenSelector from 'components/UniversalTokenSelector'
import { AddrBookItemType } from 'store/addressBook'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { Contact } from '@avalabs/types'
import {
  getAddressProperty,
  getAddressXP
} from 'store/utils/account&contactGetters'

type Props = {
  onOpenAddressBook: () => void
  onOpenSelectToken: (
    onTokenSelected: (token: TokenWithBalance) => void
  ) => void
  token?: TokenWithBalance
  contact?: Contact
  testID?: string
}

const SendToken: FC<Props> = ({ onOpenAddressBook, token, contact }) => {
  const {
    setSendToken,
    sendToken,
    setSendAmount,
    sendAmount,
    toAccount,
    canSubmit,
    sdkError,
    maxAmount
  } = useSendTokenContext()
  const { activeNetwork } = useNetworks()
  const [showQrCamera, setShowQrCamera] = useState(false)
  const [sendError, setSendError] = useState<string>()
  const placeholder =
    activeNetwork.vmName === NetworkVMType.EVM
      ? 'Enter 0x Address'
      : activeNetwork.vmName === NetworkVMType.PVM
      ? 'Enter Avax P address'
      : 'Enter Bitcoin Address'

  const sendDisabled = !canSubmit || !!(sdkError || sendError)

  const setAddress = useCallback(
    ({ address, name }: { address: string; name: string }) => {
      toAccount.setAddress?.(address)
      toAccount.setTitle?.(name)
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
  ): void => {
    switch (activeNetwork.vmName) {
      case NetworkVMType.EVM:
        setAddress({ address: getAddressProperty(item), name: item.name })
        break
      case NetworkVMType.PVM:
        setAddress({ address: getAddressXP(item) ?? '', name: item.name })
        break
      case NetworkVMType.BITCOIN:
        setAddress({
          address: item.addressBTC ?? '',
          name: item.name
        })
        break
    }
    selectContact(item, type)
    AnalyticsService.capture('SendContactSelected', { contactSource: source })
  }

  const onNextPress = (): void => {
    saveRecentContact()
    // onNext()
  }

  const handleMax = useCallback(() => {
    setSendAmount(maxAmount)
  }, [maxAmount, setSendAmount])

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Send
      </AvaText.LargeTitleBold>
      <Space y={20} />
      <AvaText.Heading3 textStyle={{ marginHorizontal: 16, marginBottom: -8 }}>
        Send To
      </AvaText.Heading3>
      <View style={[{ flex: 0, paddingStart: 4, paddingEnd: 4 }]}>
        <InputText
          testID="send_token__send_field"
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
          <UniversalTokenSelector
            testID="send_token__token_dropdown"
            onTokenChange={tkWithBalance =>
              setSendToken(tkWithBalance as TokenWithBalance)
            }
            onAmountChange={value => {
              setSendAmount(value)
              if (!value || value.bn.toString() === '0') {
                setSendError('Please enter an amount')
              } else {
                setSendError(undefined)
              }
            }}
            onMax={toAccount.address && sendToken ? handleMax : undefined}
            selectedToken={sendToken}
            inputAmount={sendAmount.bn}
            hideErrorMessage
            error={sendError ?? sdkError}
          />
          <FlexSpacer />
        </>
      )}
      <AvaButton.PrimaryLarge
        disabled={sendDisabled}
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
            setAddress({ address: data, name: '' })
            setShowQrCamera(false)
          }}
          onCancel={() => setShowQrCamera(false)}
        />
      </Modal>
    </ScrollView>
  )
}

export default SendToken
