import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
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
import { isValidContactName } from 'common/utils/isValidContactName'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AdvancedFieldProps } from 'features/accountSettings/components/AdvancedField'
import { AdvancedForm } from 'features/accountSettings/components/AdvancedForm'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import {
  addCustomNetwork,
  ChainID,
  removeCustomNetwork,
  toggleFavorite,
  updateCustomNetwork
} from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'

type NetworkFormState = {
  chainId?: string
  chainName?: string
  explorerUrl?: string
  logoUri?: string
  tokenSymbol?: string
  tokenName?: string
  rpcUrl?: string
}
export const AddEditNetworkScreen = (): JSX.Element => {
  const { canGoBack, back } = useRouter()
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const insets = useSafeAreaInsets()
  const { networks, customNetworks } = useNetworks()
  const params = useLocalSearchParams<{
    chainId: string
  }>()

  const foundNetwork: Network | null = useMemo(() => {
    if (params.chainId) {
      return networks[Number(params.chainId)] as Network
    }
    return null
  }, [params.chainId, networks])

  const isCustomNetwork = useMemo(() => {
    return Object.values(customNetworks).some(
      item => item.chainId === foundNetwork?.chainId
    )
  }, [customNetworks, foundNetwork?.chainId])

  const mode = useMemo(() => {
    if (foundNetwork || isCustomNetwork) {
      return 'edit'
    }
    return 'add'
  }, [isCustomNetwork, foundNetwork])

  const [formState, setFormState] = useState<NetworkFormState>({
    chainId: foundNetwork?.chainId.toString(),
    chainName: foundNetwork?.chainName,
    explorerUrl: foundNetwork?.explorerUrl,
    logoUri: foundNetwork?.logoUri,
    tokenSymbol: foundNetwork?.networkToken.symbol,
    tokenName: foundNetwork?.networkToken.name,
    rpcUrl: foundNetwork?.rpcUrl
  })
  const previousFormState = useRef<NetworkFormState>(formState)
  const isTestnet = useSelector(selectIsDeveloperMode)
  const alert = useRef<AlertWithTextInputsHandle>(null)

  const isSaveDisabled = useMemo(() => {
    if (
      isCustomNetwork &&
      mode === 'edit' &&
      previousFormState.current.chainId === formState.chainId &&
      previousFormState.current.chainName === formState.chainName &&
      previousFormState.current.explorerUrl === formState.explorerUrl &&
      previousFormState.current.tokenSymbol === formState.tokenSymbol &&
      previousFormState.current.tokenName === formState.tokenName &&
      previousFormState.current.rpcUrl === formState.rpcUrl
    ) {
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
    formState.explorerUrl,
    formState.rpcUrl,
    formState.tokenName,
    formState.tokenSymbol,
    isCustomNetwork,
    mode
  ])

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

  const handleAddNetwork = useCallback(() => {
    const newNetwork = {
      chainId: Number(formState.chainId),
      chainName: formState.chainName ?? '',
      description: '',
      explorerUrl: formState.explorerUrl ?? '',
      isTestnet,
      logoUri: formState.logoUri ?? '',
      mainnetChainId: 0,
      networkToken: {
        symbol: formState.tokenSymbol ?? '',
        name: formState.tokenName ?? '',
        description: '',
        decimals: 18,
        logoUri: ''
      },
      platformChainId: '',
      rpcUrl: formState.rpcUrl ?? '',
      subnetId: '',
      vmId: '',
      vmName: NetworkVMType.EVM
    }

    dispatch(addCustomNetwork(newNetwork))
    dispatch(toggleFavorite(newNetwork.chainId))
    canGoBack() && back()
  }, [
    dispatch,
    formState.chainId,
    formState.chainName,
    formState.explorerUrl,
    formState.logoUri,
    formState.tokenSymbol,
    formState.tokenName,
    formState.rpcUrl,
    isTestnet,
    canGoBack,
    back
  ])

  const handleUpdateNetwork = useCallback(
    (chainId: ChainID, network: Network): void => {
      const updatedNetwork = {
        chainId: Number(formState.chainId),
        chainName: formState.chainName ?? '',
        explorerUrl: formState.explorerUrl ?? '',
        isTestnet,
        logoUri: formState.logoUri ?? '',
        mainnetChainId: 0,
        networkToken: {
          ...network.networkToken,
          symbol: formState.tokenSymbol ?? '',
          name: formState.tokenName ?? ''
        },
        rpcUrl: formState.rpcUrl ?? '',
        vmName: NetworkVMType.EVM
      }
      dispatch(
        updateCustomNetwork({
          chainId,
          network: updatedNetwork
        })
      )
      canGoBack() && back()
    },
    [
      formState.chainId,
      formState.chainName,
      formState.explorerUrl,
      formState.logoUri,
      formState.tokenSymbol,
      formState.tokenName,
      formState.rpcUrl,
      isTestnet,
      dispatch,
      canGoBack,
      back
    ]
  )

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

    if (mode === 'edit') {
      const existingCustomNetwork = customNetworks.find(item => {
        return item.chainId === foundNetwork?.chainId
      })

      if (existingCustomNetwork && foundNetwork?.chainId) {
        handleUpdateNetwork(foundNetwork?.chainId, existingCustomNetwork)
      }
      return
    }

    handleAddNetwork()
  }, [
    networks,
    mode,
    handleAddNetwork,
    customNetworks,
    formState.chainId,
    foundNetwork?.chainId,
    handleUpdateNetwork
  ])

  const handleUpdate = useCallback((id: string, value?: string) => {
    setFormState(prev => ({ ...prev, [id]: value }))
  }, [])

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
    const disabled = mode === 'edit' && !isCustomNetwork

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

        {(isCustomNetwork || mode === 'add') && (
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

  return (
    <View sx={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          justifyContent: 'space-between',
          gap: 40
        }}>
        <View sx={{ alignItems: 'center', gap: 24 }}>
          {formState.logoUri ? (
            <NetworkLogoWithChain
              network={foundNetwork || (formState as unknown as Network)}
              networkSize={96}
              outerBorderColor={theme.colors.$surfacePrimary}
              showChainLogo
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
      </KeyboardAwareScrollView>

      {(isCustomNetwork || mode === 'add') && (
        <View
          sx={{
            gap: 16,
            backgroundColor: '$surfacePrimary',
            marginBottom: insets.bottom
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
      )}

      <View>
        <AlertWithTextInputs ref={alert} />
      </View>
    </View>
  )
}
