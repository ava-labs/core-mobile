import {
  Avatar,
  Button,
  Text,
  TouchableOpacity,
  View
} from '@avalabs/k2-alpine'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { isValidContactName } from 'common/utils/isValidContactName'
import { loadAvatar } from 'common/utils/loadAvatar'
import React, { useCallback, useMemo } from 'react'
import { Contact } from 'store/addressBook'
import { AddressType } from '../consts'
import { constructContactByAddressType } from '../utils/constructContactByAddressType'
import { AdvancedFieldProps } from './AdvancedField'
import { AdvancedForm } from './AdvancedForm'

export const ContactForm = ({
  contact,
  onUpdate,
  onSelectAvatar
}: {
  contact: Contact
  onUpdate: (contact: Contact) => void
  onSelectAvatar: () => void
}): React.JSX.Element => {
  const { networks } = usePrimaryNetworks()

  const avatar = useMemo(() => {
    return loadAvatar(contact.avatar)
  }, [contact?.avatar])

  const handleUpdateAddress = useCallback(
    (addressType: AddressType, value?: string) => {
      const updatedContact = constructContactByAddressType(
        contact,
        addressType,
        value
      )

      onUpdate(updatedContact)
    },
    [contact, onUpdate]
  )

  const data: AdvancedFieldProps[] = useMemo(() => {
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
        id: network.chainName,
        title: network.chainName,
        placeholder: `Type in or paste in ${network.chainName} address`,
        emptyText: `Add ${network.chainName} address`,
        value: address,
        type: 'address',
        onUpdate: (id, value) => {
          handleUpdateAddress(id as AddressType, value)
        }
      }
    })
  }, [
    contact.address,
    contact.addressBTC,
    contact.addressXP,
    handleUpdateAddress,
    networks
  ])

  const handleShowAlertWithTextInput = useCallback((): void => {
    showAlertWithTextInput({
      title: 'Name this contact',
      inputs: [{ key: 'save', defaultValue: contact.name }],
      buttons: [
        {
          text: 'Cancel',
          onPress: dismissAlertWithTextInput
        },
        {
          text: 'Save',
          style: 'default',
          shouldDisable: (values: Record<string, string>) => {
            return (
              !isValidContactName(values.save) || values.save === contact.name
            )
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

  const renderName = useCallback(() => {
    if (contact?.name) {
      return (
        <View sx={{ gap: 24, alignItems: 'center' }}>
          <Text
            variant="heading2"
            sx={{ color: '$textPrimary', lineHeight: 44 }}
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

  return (
    <View sx={{ gap: 40 }}>
      <View sx={{ alignItems: 'center', gap: 24, marginTop: 16 }}>
        <TouchableOpacity onPress={onSelectAvatar}>
          <Avatar
            size={150}
            source={avatar?.source}
            hasLoading={false}
            showAddIcon={avatar?.source === undefined}
          />
        </TouchableOpacity>

        {renderName()}
      </View>

      <AdvancedForm data={data} />
    </View>
  )
}
