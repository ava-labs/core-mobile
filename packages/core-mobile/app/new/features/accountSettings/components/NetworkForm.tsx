import { Network } from '@avalabs/core-chains-sdk'
import {
  AlertWithTextInputs,
  Avatar,
  Button,
  Text,
  View,
  showAlert
} from '@avalabs/k2-alpine'
import { AlertWithTextInputsHandle } from '@avalabs/k2-alpine/src/components/Alert/types'
import { usePrimaryNetworks } from 'common/hooks/usePrimaryNetworks'
import { isValidContactName } from 'common/utils/isValidContactName'
import { Space } from 'components/Space'
import React, { useCallback, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { AddressType } from '../consts'
import { isValidAddress } from '../utils/isValidAddress'
import { NetworkAddressForm } from './NetworkAddressForm'

export const NetworkForm = ({
  network,
  onUpdate
}: {
  network: Network
  onUpdate: (network: Network) => void
}): React.JSX.Element => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const alert = useRef<AlertWithTextInputsHandle>(null)

  const handleShowAlertWithTextInput = useCallback((): void => {
    alert.current?.show({
      title: 'Name this network',
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
              onUpdate({ ...network, chainName: values.save?.trim() })
              alert.current?.hide()
            }
          }
        }
      ]
    })
  }, [network, onUpdate])

  const handleUpdateNetwork = useCallback(
    (addressType: AddressType, value?: string) => {
      const updatedContact = { ...network }

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
    [network, onUpdate, isDeveloperMode]
  )

  const data = useMemo(() => {
    return networks.map(network => {
      return {
        title: network.chainName as AddressType,
        placeholder: `Type in or paste in ${network.chainName} address`,
        emptyText: `Add ${network.chainName} address`,
        chainId: network.chainId
      }
    })
  }, [networks])

  const renderName = useCallback(() => {
    if (network.chainName) {
      return (
        <View sx={{ gap: 24, alignItems: 'center' }}>
          <Text variant="heading2" sx={{ color: '$textPrimary' }}>
            {network.chainName}
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
        Name this network
      </Button>
    )
  }, [network.chainName, handleShowAlertWithTextInput])

  return (
    <View sx={{ alignItems: 'center' }}>
      <Avatar
        backgroundColor="transparent"
        size={150}
        // todo: replace with actual avatar
        source={{
          uri: 'https://miro.medium.com/v2/resize:fit:1256/format:webp/1*xm2-adeU3YD4MsZikpc5UQ.png'
        }}
        hasLoading={false}
      />
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
        {data.map((item, index) => (
          <View key={index} sx={{ width: '100%' }}>
            <NetworkAddressForm
              key={index}
              title={item.title}
              placeholder={item.placeholder}
              emptyText={item.emptyText}
              onUpdateNetwork={handleUpdateNetwork}
            />
            {index !== data.length - 1 && (
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
