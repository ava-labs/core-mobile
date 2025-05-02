import { Network } from '@avalabs/core-chains-sdk'
import {
  AlertWithTextInputs,
  Button,
  Icons,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { AlertWithTextInputsHandle } from '@avalabs/k2-alpine/src/components/Alert/types'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormState } from 'common/hooks/useFormState'
import { isValidContactName } from 'common/utils/isValidContactName'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AdvancedFieldProps } from 'features/accountSettings/components/AdvancedField'
import { AdvancedForm } from 'features/accountSettings/components/AdvancedForm'

import {
  CustomNetworkType,
  useCustomNetwork
} from 'features/accountSettings/hooks/useCustomNetwork'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { useCallback, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { removeCustomNetwork } from 'store/network'
import { isPChain, isXChain, isXPChain } from 'utils/network/isAvalancheNetwork'

enum Mode {
  ADD = 'add',
  EDIT = 'edit'
}

export const AddEditNetworkScreen = (): JSX.Element => {
  const { canGoBack, back } = useRouter()
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const { networks, customNetworks } = useNetworks()
  const params = useLocalSearchParams<{
    chainId: string
  }>()

  const { handleAddNetwork, handleUpdateNetwork } = useCustomNetwork()

  const alert = useRef<AlertWithTextInputsHandle>(null)

  const foundNetwork: Network | null = useMemo(() => {
    if (params.chainId) {
      return networks[Number(params.chainId)] as Network
    }
    return null
  }, [params.chainId, networks])

  const { formState, isInitialStateDifferent, handleUpdate } =
    useFormState<CustomNetworkType>({
      chainId: foundNetwork?.chainId.toString(),
      chainName: foundNetwork?.chainName,
      explorerUrl: foundNetwork?.explorerUrl,
      logoUri: foundNetwork?.logoUri,
      tokenSymbol: foundNetwork?.networkToken.symbol,
      tokenName: foundNetwork?.networkToken.name,
      rpcUrl: foundNetwork?.rpcUrl
    })

  const isCustomNetwork = useMemo(() => {
    return Object.values(customNetworks).some(
      item => item.chainId === foundNetwork?.chainId
    )
  }, [customNetworks, foundNetwork?.chainId])

  const mode = useMemo(() => {
    if (foundNetwork || isCustomNetwork) return Mode.EDIT
    return Mode.ADD
  }, [isCustomNetwork, foundNetwork])

  const isSaveDisabled = useMemo(() => {
    if (isCustomNetwork && mode === Mode.EDIT && isInitialStateDifferent) {
      return true
    }
    return (
      formState.chainId === undefined ||
      formState.chainName === undefined ||
      formState.tokenSymbol === undefined ||
      formState.tokenName === undefined ||
      formState.rpcUrl === undefined
    )
  }, [
    formState.chainId,
    formState.chainName,
    formState.rpcUrl,
    formState.tokenName,
    formState.tokenSymbol,
    isCustomNetwork,
    isInitialStateDifferent,
    mode
  ])

  const showChainLogo = useMemo(() => {
    if (foundNetwork) {
      return (
        isXPChain(foundNetwork.chainId) ||
        isPChain(foundNetwork.chainId) ||
        isXChain(foundNetwork.chainId)
      )
    }
    return false
  }, [foundNetwork])

  const handleDelete = useCallback(() => {
    showAlert({
      title: 'Delete network',
      description: 'Are you sure you want to delete this network?',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            alert.current?.hide()
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (foundNetwork?.chainId) {
              dispatch(removeCustomNetwork(foundNetwork?.chainId))
            }
            canGoBack() && back()
          }
        }
      ]
    })
  }, [foundNetwork?.chainId, dispatch, canGoBack, back])

  const handleSubmit = useCallback(() => {
    // Filter out custom networks
    const existingNetwork = Object.values(networks)
      .filter(
        network =>
          !customNetworks.some(item => item.chainId === network.chainId)
      )
      .some(item => Number(item.chainId) === Number(formState.chainId))

    if (existingNetwork) {
      showAlert({
        title: 'Network already exists',
        description: 'Please choose a different chain ID',
        buttons: [
          {
            text: 'OK'
          }
        ]
      })
      return
    }

    if (mode === Mode.EDIT) {
      const existingCustomNetwork = customNetworks.find(item => {
        return item.chainId === foundNetwork?.chainId
      })

      if (existingCustomNetwork && foundNetwork?.chainId) {
        handleUpdateNetwork(foundNetwork.chainId, formState)
      }
    } else {
      handleAddNetwork(formState)
    }

    canGoBack() && back()
  }, [
    networks,
    mode,
    handleAddNetwork,
    formState,
    canGoBack,
    back,
    customNetworks,
    foundNetwork?.chainId,
    handleUpdateNetwork
  ])

  const handleShowAlertWithTextInput = useCallback((): void => {
    alert.current?.show({
      title: 'Name this network',
      inputs: [{ key: 'save', defaultValue: formState.chainName }],
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
              handleUpdate('chainName', values.save?.trim())
              alert.current?.hide()
            }
          }
        }
      ]
    })
  }, [formState.chainName, handleUpdate])

  const data: AdvancedFieldProps[] = useMemo(() => {
    const disabled = mode === Mode.EDIT && !isCustomNetwork

    const rpcUrl: AdvancedFieldProps = {
      id: 'rpcUrl',
      title: 'Network RPC URL',
      value: formState.rpcUrl,
      placeholder: `Network RPC URL`,
      emptyText: `Add Network RPC URL`,
      type: 'url',
      disabled,
      onUpdate: handleUpdate
    }

    const chainId: AdvancedFieldProps = {
      id: 'chainId',
      title: 'Chain ID',
      value: formState.chainId?.toString(),
      placeholder: 'Chain ID',
      emptyText: 'Add Chain ID',
      type: 'number',
      disabled,
      onUpdate: handleUpdate
    }

    const tokenSymbol: AdvancedFieldProps = {
      id: 'tokenSymbol',
      title: 'Token symbol',
      value: formState.tokenSymbol,
      placeholder: 'Token symbol',
      emptyText: 'Add token symbol',
      disabled,
      onUpdate: handleUpdate
    }

    const tokenName: AdvancedFieldProps = {
      id: 'tokenName',
      title: 'Token name',
      value: formState.tokenName,
      placeholder: 'Token name',
      emptyText: 'Add token name',
      disabled,
      onUpdate: handleUpdate
    }

    const explorerUrl: AdvancedFieldProps = {
      id: 'explorerUrl',
      title: 'Explorer URL',
      value: formState.explorerUrl,
      optional: true,
      placeholder: 'Explorer URL',
      emptyText: 'Add explorer URL',
      type: 'url',
      disabled,
      onUpdate: handleUpdate
    }

    if (!isCustomNetwork && foundNetwork) {
      const readOnlyFields: AdvancedFieldProps[] = []
      if (foundNetwork.rpcUrl) readOnlyFields.push(rpcUrl)
      if (foundNetwork.chainId) readOnlyFields.push(chainId)
      if (foundNetwork.networkToken.symbol) readOnlyFields.push(tokenSymbol)
      if (foundNetwork.networkToken.name) readOnlyFields.push(tokenName)
      if (foundNetwork.explorerUrl) readOnlyFields.push(explorerUrl)

      return readOnlyFields
    }

    const editableFields: AdvancedFieldProps[] = [
      rpcUrl,
      chainId,
      tokenSymbol,
      tokenName,
      explorerUrl
    ]

    return editableFields
  }, [
    mode,
    isCustomNetwork,
    formState.rpcUrl,
    formState.chainId,
    formState.tokenSymbol,
    formState.tokenName,
    formState.explorerUrl,
    handleUpdate,
    foundNetwork
  ])

  const renderName = useCallback(() => {
    return (
      <View sx={{ gap: 24, alignItems: 'center' }}>
        {formState.chainName && (
          <Text
            variant="heading2"
            sx={{ color: '$textPrimary', textAlign: 'center' }}>
            {formState.chainName}
          </Text>
        )}

        {(isCustomNetwork || mode === Mode.ADD) && (
          <View>
            <Button
              onPress={handleShowAlertWithTextInput}
              type="secondary"
              size="small">
              Name this network
            </Button>
          </View>
        )}
      </View>
    )
  }, [formState.chainName, handleShowAlertWithTextInput, isCustomNetwork, mode])

  const renderFooter = useCallback(() => {
    if (isCustomNetwork || mode === Mode.ADD)
      return (
        <View
          sx={{
            gap: 16
          }}>
          <Button
            type="primary"
            size="large"
            onPress={handleSubmit}
            disabled={isSaveDisabled}>
            Save
          </Button>
          {foundNetwork ? (
            <Button
              type="secondary"
              textStyle={{
                color: theme.colors.$textDanger
              }}
              size="large"
              onPress={handleDelete}>
              Delete
            </Button>
          ) : (
            <Button
              type="tertiary"
              size="large"
              onPress={() => canGoBack() && back()}>
              Cancel
            </Button>
          )}
        </View>
      )
    return <></>
  }, [
    back,
    canGoBack,
    foundNetwork,
    handleDelete,
    handleSubmit,
    isCustomNetwork,
    isSaveDisabled,
    mode,
    theme.colors.$textDanger
  ])

  return (
    <>
      <ScrollScreen
        isModal
        renderFooter={renderFooter}
        contentContainerStyle={{
          padding: 16,
          gap: 40,
          flex: 1
        }}>
        <View sx={{ alignItems: 'center', gap: 24 }}>
          {formState.logoUri ? (
            <NetworkLogoWithChain
              network={foundNetwork || (formState as unknown as Network)}
              networkSize={96}
              outerBorderColor={theme.colors.$surfacePrimary}
              showChainLogo={showChainLogo}
              chainLogoSize={24}
              chainLogoStyle={{
                borderWidth: 16
              }}
            />
          ) : (
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 96,
                overflow: 'hidden',
                backgroundColor: theme.colors.$surfaceSecondary,
                borderWidth: 1,
                borderColor: theme.colors.$borderPrimary,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <Icons.Custom.Category
                width={40}
                height={40}
                color={theme.colors.$textSecondary}
              />
            </View>
          )}
          {renderName()}
        </View>

        <AdvancedForm data={data} />
      </ScrollScreen>

      <View>
        <AlertWithTextInputs ref={alert} />
      </View>
    </>
  )
}
