import {
  Avatar,
  Button,
  Text,
  TouchableOpacity,
  View
} from '@avalabs/k2-alpine'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { Space } from 'common/components/Space'
import { useFormState } from 'common/hooks/useFormState'
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

  const { formState, handleUpdate } = useFormState<Contact>(contact)

  const data: AdvancedFieldProps[] = useMemo(() => {
    // const disabled = mode === Mode.EDIT && !isCustomNetwork

    return networks.map(network => {
      const value =
        network.vmName === NetworkVMType.AVM ||
        network.vmName === NetworkVMType.PVM
          ? formState.addressXP?.replace(/^[XP]-/, '')
          : network.vmName === NetworkVMType.BITCOIN
          ? formState.addressBTC
          : network.vmName === NetworkVMType.EVM
          ? formState.address
          : undefined

      return {
        id: network.chainId.toString(),
        title: network.chainName as AddressType,
        value,
        placeholder: `Type in or paste in ${network.chainName} address`,
        emptyText: `Add ${network.chainName} address`,
        type: 'address',
        onUpdate: handleUpdate
      }
    })
  }, [
    formState.address,
    formState.addressBTC,
    formState.addressXP,
    handleUpdate,
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

      <AdvancedForm data={data} />
    </View>
  )
}
