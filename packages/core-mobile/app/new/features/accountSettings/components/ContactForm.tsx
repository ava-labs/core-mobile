import {
  Avatar,
  Button,
  Text,
  TouchableOpacity,
  View,
  showAlert
} from '@avalabs/k2-alpine'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { Space } from 'common/components/Space'
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { isValidContactName } from 'common/utils/isValidContactName'
import { loadAvatar } from 'common/utils/loadAvatar'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Contact } from 'store/addressBook'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { AddressType } from '../consts'
import { constructContactByAddressType } from '../utils/constructContactByAddressType'
import { isValidAddress } from '../utils/isValidAddress'
import { ContactAddressForm } from './ContactAddressForm'

export const ContactForm = ({
  contact,
  onUpdate,
  onSelectAvatar
}: {
  contact: Contact
  onUpdate: (contact: Contact) => void
  onSelectAvatar: () => void
}): React.JSX.Element => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networks } = usePrimaryNetworks()

  const handleShowAlertWithTextInput = useCallback((): void => {
    showAlertWithTextInput({
      title: 'Name this contact',
      inputs: [{ key: 'save' }],
      buttons: [
        {
          text: 'Cancel',
          onPress: dismissAlertWithTextInput
        },
        {
          text: 'Save',
          style: 'default',
          shouldDisable: (values: Record<string, string>) => {
            return !isValidContactName(values.save)
          },
          onPress: (values: Record<string, string>) => {
            if (values.save !== '' && values.save !== undefined) {
              onUpdate({
                ...contact,
                name: values.save?.trim()
              })
              dismissAlertWithTextInput()
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
              text: 'Cancel'
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => onUpdate(updatedContact)
            }
          ]
        })
        return
      }

      if (!isValidAddress({ addressType, address: value, isDeveloperMode })) {
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

  const addressData = useMemo(() => {
    return networks.map(network => {
      const address =
        network.vmName === NetworkVMType.AVM ||
        network.vmName === NetworkVMType.PVM
          ? contact.addressXP?.replace(/^[XP]-/, '')
          : network.vmName === NetworkVMType.BITCOIN
          ? contact.addressBTC
          : network.vmName === NetworkVMType.EVM
          ? contact.address
          : undefined

      return {
        title: network.chainName as AddressType,
        placeholder: `Type in or paste in ${network.chainName} address`,
        emptyText: `Add ${network.chainName} address`,
        address
      }
    })
  }, [contact.address, contact.addressBTC, contact.addressXP, networks])

  const renderName = useCallback(() => {
    if (contact?.name) {
      return (
        <View sx={{ gap: 24, alignItems: 'center' }}>
          <Text
            variant="heading2"
            sx={{ color: '$textPrimary' }}
            numberOfLines={4}>
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

  const avatar = useMemo(() => {
    return loadAvatar(contact.avatar)
  }, [contact?.avatar])

  return (
    <View sx={{ alignItems: 'center' }}>
      <TouchableOpacity onPress={onSelectAvatar}>
        <Avatar
          size={150}
          source={avatar?.source}
          hasLoading={false}
          showAddIcon={avatar?.source === undefined}
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
        {addressData.map((item, index) => (
          <View key={index} sx={{ width: '100%' }}>
            <ContactAddressForm
              key={index}
              title={item.title}
              placeholder={item.placeholder}
              emptyText={item.emptyText}
              address={item.address}
              onUpdateAddress={handleUpdateAddress}
            />
            {index !== addressData.length - 1 && (
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
    </View>
  )
}
