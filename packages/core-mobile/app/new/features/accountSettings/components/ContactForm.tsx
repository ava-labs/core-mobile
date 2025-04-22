import { noop } from '@avalabs/core-utils-sdk'
import {
  AlertWithTextInputs,
  Avatar,
  Button,
  Text,
  TouchableOpacity,
  View,
  showAlert
} from '@avalabs/k2-alpine'
import { AlertWithTextInputsHandle } from '@avalabs/k2-alpine/src/components/Alert/types'
import { isValidContactName } from 'common/utils/isValidContactName'
import { Space } from 'components/Space'
import React, { useCallback, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Contact } from 'store/addressBook'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedAvatar } from 'store/settings/avatar'
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
  const alert = useRef<AlertWithTextInputsHandle>(null)
  const avatar = useSelector(selectSelectedAvatar)

  const handleShowAlertWithTextInput = useCallback((): void => {
    alert.current?.show({
      title: 'Name this contact',
      inputs: [{ key: 'save' }],
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            alert.current?.hide()
          }
        },
        {
          text: 'Save',
          style: 'default',
          shouldDisable: (values: Record<string, string>) => {
            return !isValidContactName(values.save)
          },
          onPress: (values: Record<string, string>) => {
            if (values.save !== '' && values.save !== undefined) {
              onUpdate({ ...contact, name: values.save?.trim() })
              alert.current?.hide()
            }
          }
        }
      ]
    })
  }, [contact, onUpdate])

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
          source={avatar.source}
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
        <AlertWithTextInputs ref={alert} />
      </View>
    </View>
  )
}
