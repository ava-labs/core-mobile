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
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { AddressType } from '../consts'
import { constructContactByAddressType } from '../utils/constructContactByAddressType'
import { isValidAddress } from '../utils/isValidAddress'
import { ContactAddressForm } from './ContactAddressForm'

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
              text: 'Dismiss',
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
        title: AddressType.EVM,
        placeholder: 'Type in or paste in C-Chain/EVM address',
        emptyText: 'Add Avalanche C-Chain/EVM address',
        address: contact?.address
      },
      {
        title: AddressType.XP,
        placeholder: 'Type in or paste in X/P-Chain address',
        emptyText: 'Add Avalanche X/P-Chain address',
        address: contact?.addressXP
      },
      {
        title: AddressType.BTC,
        placeholder: 'Type in or paste in Bitcoin address',
        emptyText: 'Add Bitcoin address',
        address: contact?.addressBTC
      }
    ],
    [contact]
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
              onUpdateAddress={handleUpdateAddress}
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
      <View>
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
                const trimmedValue = values.save?.trim()
                const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/
                return (
                  trimmedValue === '' ||
                  trimmedValue === undefined ||
                  !regex.test(trimmedValue)
                )
              },
              onPress: (values: Record<string, string>) => {
                if (values.save !== '' && values.save !== undefined) {
                  onUpdate({ ...contact, name: values.save?.trim() })
                  handleHideAlertWithTextInput()
                }
              }
            }
          ]}
        />
      </View>
    </View>
  )
}
