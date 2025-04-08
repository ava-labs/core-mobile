import React, { useCallback, useMemo, useState } from 'react'
import {
  View,
  Text,
  Button,
  Avatar,
  TouchableOpacity,
  showAlert,
  AlertWithTextInputs
} from '@avalabs/k2-alpine'
import { Contact } from 'store/addressBook'
import { noop } from '@avalabs/core-utils-sdk'
import { Space } from 'components/Space'
import { isBech32Address } from '@avalabs/core-bridge-sdk'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isBtcAddress } from 'utils/isBtcAddress'
import { isAddress } from 'ethers'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { ContactAddressForm } from './ContactAddressForm'

export enum AddressType {
  CChain = 'Avalanche C-Chain',
  PVM = 'Avalanche P-Chain',
  AVM = 'Avalanche X-Chain',
  EVM = 'Ethereum',
  BTC = 'Bitcoin'
}

export const ContactForm = ({
  contact,
  onUpdate
}: {
  contact: Contact
  onUpdate: (contact: Contact) => void
}): React.JSX.Element => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [alertWithTextInputVisible, setAlertWithTextInputVisible] =
    useState(false)
  const handleShowAlertWithTextInput = useCallback((): void => {
    setAlertWithTextInputVisible(true)
  }, [])

  const handleHideAlertWithTextInput = useCallback((): void => {
    setAlertWithTextInputVisible(false)
  }, [])

  const handleUpdateAddress = useCallback(
    (addressType: AddressType, value?: string) => {
      const updatedContact = constructContactByAddressType(
        contact,
        addressType,
        value
      )

      if (value === undefined) {
        showAlert({
          title: 'Do you want to delete this address?',
          description: 'This action can’t be undone',
          buttons: [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Delete',
              onPress: () => onUpdate(updatedContact)
            }
          ]
        })
        return
      }

      if (!isValidAddress(addressType, value, isDeveloperMode)) {
        showAlert({
          title: 'Invalid address',
          description:
            'The address your entered is not valid for the selected chain',
          buttons: [
            {
              text: 'dismiss',
              style: 'default'
            }
          ]
        })
        return
      }

      onUpdate(updatedContact)
    },
    [contact, onUpdate, isDeveloperMode]
  )

  const adressData = useMemo(
    () => [
      {
        title: AddressType.CChain,
        placeholder: 'Type in or paste in C-Chain address',
        emptyText: 'Add Avalanche C-Chain address',
        address: contact?.addressC,
        onUpdateAddress: handleUpdateAddress
      },
      {
        title: AddressType.PVM,
        placeholder: 'Type in or paste in P-Chain address',
        emptyText: 'Add Avalanche P-Chain address',
        address: contact?.addressPVM,
        onUpdateAddress: handleUpdateAddress
      },
      {
        title: AddressType.AVM,
        placeholder: 'Type in or paste in X-Chain address',
        emptyText: 'Add Avalanche X-Chain address',
        address: contact?.addressAVM,
        onUpdateAddress: handleUpdateAddress
      },
      {
        title: AddressType.EVM,
        placeholder: 'Type in or paste in Ethereum address',
        emptyText: 'Add Ethereum address',
        address: contact?.addressEVM,
        onUpdateAddress: handleUpdateAddress
      },
      {
        title: AddressType.BTC,
        placeholder: 'Type in or paste in Bitcoin address',
        emptyText: 'Add Bitcoin address',
        address: contact?.addressBTC,
        onUpdateAddress: handleUpdateAddress
      }
    ],
    [contact, handleUpdateAddress]
  )

  const renderName = useCallback(() => {
    if (contact?.name) {
      return (
        <View sx={{ gap: 24, alignItems: 'center' }}>
          <Text variant="heading2" sx={{ color: '$textPrimary' }}>
            {contact.name}
          </Text>
          <Button
            type="secondary"
            size="small"
            style={{ width: 90 }}
            onPress={handleShowAlertWithTextInput}>
            Edit name
          </Button>
        </View>
      )
    }
    return (
      <Button
        onPress={handleShowAlertWithTextInput}
        type="secondary"
        size="small"
        style={{ width: 140, borderRadius: 21 }}>
        Name this contact
      </Button>
    )
  }, [contact.name, handleShowAlertWithTextInput])

  return (
    <View sx={{ alignItems: 'center' }}>
      {/* todo: open up avatar selector */}
      <TouchableOpacity onPress={noop}>
        <Avatar
          backgroundColor="transparent"
          size={150}
          // todo: replace with actual avatar
          source={{
            uri: 'https://miro.medium.com/v2/resize:fit:1256/format:webp/1*xm2-adeU3YD4MsZikpc5UQ.png'
          }}
          hasLoading={false}
        />
      </TouchableOpacity>
      <Space y={20} />
      {renderName()}
      <Space y={47} />

      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          width: '100%',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 12
        }}>
        {adressData.map((item, index) => (
          <View key={index} sx={{ width: '100%' }}>
            <ContactAddressForm
              key={index}
              title={item.title}
              placeholder={item.placeholder}
              emptyText={item.emptyText}
              address={item.address}
              onUpdateAddress={item.onUpdateAddress}
            />
            {index !== adressData.length - 1 && (
              <View
                sx={{
                  marginVertical: 15,
                  height: 1,
                  backgroundColor: '$borderPrimary'
                }}
              />
            )}
          </View>
        ))}
      </View>
      <AlertWithTextInputs
        visible={alertWithTextInputVisible}
        title="Name this contact"
        inputs={[{ key: 'save' }]}
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              handleHideAlertWithTextInput()
            }
          },
          {
            text: 'Save',
            style: 'default',
            shouldDisable: (values: Record<string, string>) => {
              return values.save === ''
            },
            onPress: (values: Record<string, string>) => {
              if (values.save !== '') {
                onUpdate({ ...contact, name: values.save })
                handleHideAlertWithTextInput()
              }
            }
          }
        ]}
      />
    </View>
  )
}

const constructContactByAddressType = (
  contact: Contact,
  addressType: AddressType,
  address?: string
): Contact => {
  switch (addressType) {
    case AddressType.CChain:
      return { ...contact, addressC: address }
    case AddressType.PVM:
      return { ...contact, addressPVM: address }
    case AddressType.AVM:
      return { ...contact, addressAVM: address }
    case AddressType.EVM:
      return { ...contact, addressEVM: address }
    case AddressType.BTC:
      return { ...contact, addressBTC: address }
  }
}

const isValidAddress = (
  addressType: AddressType,
  address: string,
  isDeveloperMode = false
): boolean => {
  switch (addressType) {
    case AddressType.CChain:
    case AddressType.EVM:
      return isAddress(address) || isBech32Address(address)
    case AddressType.PVM:
    case AddressType.AVM:
      return (
        Avalanche.isBech32Address(address, false) &&
        ((isDeveloperMode && address.includes('fuji')) ||
          (!isDeveloperMode && address.includes('avax')))
      )
    case AddressType.BTC:
      return isBtcAddress(address, !isDeveloperMode)
  }
}
