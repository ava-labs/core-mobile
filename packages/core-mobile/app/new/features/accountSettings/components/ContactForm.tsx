import {
  Avatar,
  Button,
  showAlert,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { useNetworksByAddress } from 'common/hooks/useNetworksByAddress'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { isValidContactName } from 'common/utils/isValidContactName'
import { loadAvatar } from 'common/utils/loadAvatar'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useRef } from 'react'
import { Contact } from 'store/addressBook'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { AddressType } from '../consts'
import { constructContactByAddressType } from '../utils/constructContactByAddressType'
import { isValidAddress } from '../utils/isValidAddress'
import {
  AdvancedField,
  AdvancedFieldProps,
  AdvancedFieldRef
} from './AdvancedField'

export const ContactForm = ({
  contact,
  onUpdate,
  onSelectAvatar
}: {
  contact: Contact
  onUpdate: (contact: Contact) => void
  onSelectAvatar: () => void
}): React.JSX.Element => {
  const { networks } = useNetworksByAddress()

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

  const renderField = useCallback(
    (item: AdvancedFieldProps, index: number): React.JSX.Element => {
      return (
        <ContactFormField
          key={item.id}
          item={item}
          onUpdateAddress={handleUpdateAddress}
          showSeparator={index !== data.length - 1}
        />
      )
    },
    [data.length, handleUpdateAddress]
  )

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

      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          width: '100%',
          borderRadius: 12
        }}>
        {data.map(renderField)}
      </View>
    </View>
  )
}

const ContactFormField = ({
  item,
  showSeparator,
  onUpdateAddress
}: {
  item: AdvancedFieldProps
  showSeparator: boolean
  onUpdateAddress: (addressType: AddressType, value?: string) => void
}): React.ReactNode => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { theme } = useTheme()
  const params = useLocalSearchParams<{
    address: string
    addressType: AddressType
  }>()
  const { setParams } = useRouter()

  const ref = useRef<AdvancedFieldRef>(null)

  useFocusEffect(
    useCallback(() => {
      if (params.address && params.addressType === item.title) {
        if (
          !isValidAddress({
            addressType: params.addressType,
            address: params.address,
            isDeveloperMode
          })
        ) {
          showAlert({
            title: 'Invalid address',
            description:
              'The address you entered is not valid for the selected chain',
            buttons: [
              {
                text: 'Got it',
                style: 'default',
                onPress: () => {
                  ref.current?.setInputValue('')
                  // @ts-ignore TODO: make route params typesafe
                  setParams({ address: undefined, addressType: undefined })
                }
              }
            ]
          })
          return
        }
        onUpdateAddress(params.addressType, params.address)
        ref.current?.setInputValue(params.address)
        // @ts-ignore TODO: make route params typesafe
        setParams({ address: undefined, addressType: undefined })
      }
    }, [
      params.address,
      params.addressType,
      item.title,
      isDeveloperMode,
      onUpdateAddress,
      setParams
    ])
  )
  return (
    <View key={item.id}>
      <AdvancedField ref={ref} {...item} />

      {showSeparator && (
        <View
          sx={{
            height: 1,
            backgroundColor: theme.colors.$borderPrimary,
            marginHorizontal: 16
          }}
        />
      )}
    </View>
  )
}
