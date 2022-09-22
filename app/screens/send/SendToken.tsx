import React, { FC, useCallback, useEffect, useState } from 'react'
import { Modal, ScrollView, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import InputText from 'components/InputText'
import AvaButton from 'components/AvaButton'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import FlexSpacer from 'components/FlexSpacer'
import { useSendTokenContext } from 'contexts/SendTokenContext'
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
import { usePosthogContext } from 'contexts/PosthogContext'
import { bnToLocaleString, ethersBigNumberToBN } from '@avalabs/utils-sdk'
import UniversalTokenSelector from 'components/UniversalTokenSelector'
import { getMaxValue } from 'utils/Utils'
import { Amount } from 'screens/swap/SwapView'

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
  token,
  contact
}) => {
  const { capture } = usePosthogContext()
  const {
    setSendToken,
    sendToken,
    setSendAmount,
    sendAmount,
    toAccount,
    fees,
    canSubmit,
    sdkError
  } = useSendTokenContext()
  const activeNetwork = useSelector(selectActiveNetwork)
  const [showQrCamera, setShowQrCamera] = useState(false)
  const [sendError, setSendError] = useState<string>()
  const placeholder =
    activeNetwork.vmName === NetworkVMType.EVM
      ? 'Enter 0x Address'
      : 'Enter Bitcoin Address'

  const sendDisabled = !canSubmit || !!(sdkError || sendError)

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

  const handleMax = useCallback(() => {
    const maxBn = getMaxValue(sendToken, fees.sendFeeNative)
    if (maxBn) {
      setSendAmount({
        bn: maxBn,
        amount: bnToLocaleString(maxBn, sendToken?.decimals)
      } as Amount)
    }
  }, [fees.sendFeeNative, sendToken, setSendAmount])

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
          <View style={{ paddingHorizontal: 16 }}>
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
