import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  AlertWithTextInputs,
  Avatar,
  Button,
  showAlert,
  Text,
  View
} from '@avalabs/k2-alpine'
import { AlertWithTextInputsHandle } from '@avalabs/k2-alpine/src/components/Alert/types'
import { isValidContactName } from 'common/utils/isValidContactName'
import { Space } from 'components/Space'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AdvancedFieldProps } from 'features/accountSettings/components/AdvancedField'
import { AdvancedForm } from 'features/accountSettings/components/AdvancedForm'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, {
  Reducer,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { addCustomNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export type AddEditNetworkProps = {
  mode: 'edit' | 'create'
}

const errorsInitialState = {
  rpcUrl: '',
  networkName: '',
  chainId: '',
  nativeTokenSymbol: '',
  explorerUrl: ''
} as const
type Errors = typeof errorsInitialState

export const AddEditNetworkScreen = ({
  mode
}: AddEditNetworkProps): JSX.Element => {
  const { canGoBack, back } = useRouter()
  const dispatch = useDispatch()
  const insets = useSafeAreaInsets()
  const { allNetworks } = useNetworks()
  const { networkId } = useLocalSearchParams<{ networkId: string }>()

  const isTestnet = useSelector(selectIsDeveloperMode)

  const [network, setNetwork] = useState<Partial<Network>>({
    chainId: networkId ? Number(networkId) : undefined
  })

  const isSaveDisabled = useMemo(() => {
    return (
      (network.rpcUrl === undefined &&
        network.chainName === undefined &&
        network.chainId === undefined) ||
      network.chainName?.length === 0
    )
  }, [network])

  const [_errors, _dispatchErrors] = useReducer<
    Reducer<Errors, Partial<Errors> | 'reset'>
  >((curVal, newVal) => {
    if (newVal === 'reset') return errorsInitialState
    return { ...curVal, ...newVal }
  }, errorsInitialState)
  const [showErrors, setShowErrors] = useState(false)

  function getError(error: keyof typeof _errors): string {
    if (!showErrors) return ''
    return _errors[error]
  }

  const setError = useCallback(
    <K extends keyof typeof _errors>(error: K, value: string) => {
      _dispatchErrors({ [error]: value })
    },
    []
  )

  const hasErrors = useCallback(() => {
    return Object.values(_errors).some(e => e)
  }, [_errors])

  useEffect(validateInputs, [
    allNetworks,
    mode,
    network.chainId,
    network.chainName,
    network.explorerUrl,
    network.networkToken?.symbol,
    network.rpcUrl,
    setError
  ])

  const handleSave = useCallback(() => {
    setShowErrors(true)
    if (hasErrors()) return

    const newNetwork: Network = {
      chainId: Number(network.chainId),
      chainName: network.chainName ?? '',
      description: '',
      explorerUrl: network.explorerUrl ?? '',
      isTestnet,
      logoUri: network.logoUri ?? '',
      mainnetChainId: 0,
      networkToken: {
        symbol: network.networkToken?.symbol ?? '',
        name: network.networkToken?.name ?? '',
        description: '',
        decimals: 18,
        logoUri: ''
      },
      platformChainId: '',
      rpcUrl: network.rpcUrl ?? '',
      subnetId: '',
      vmId: '',
      vmName: NetworkVMType.EVM
    }
    dispatch(addCustomNetwork(newNetwork))
    canGoBack() && back()
  }, [
    hasErrors,
    network.chainId,
    network.chainName,
    network.explorerUrl,
    network.logoUri,
    network.networkToken?.symbol,
    network.networkToken?.name,
    network.rpcUrl,
    isTestnet,
    dispatch,
    canGoBack,
    back
  ])

  function validateInputs(): void {
    _dispatchErrors('reset')
    if (!network.rpcUrl) {
      setError('rpcUrl', 'Required')
    }
    if (!isValidURL(network.rpcUrl ?? '')) {
      setError('rpcUrl', 'URL is invalid')
    }
    if (!network.chainName) {
      setError('networkName', 'Required')
    }
    if (!network.chainId || isNaN(network.chainId)) {
      setError('chainId', 'Must be a number')
    }
    if (network.chainId === 0) {
      setError('chainId', 'Cannot be 0')
    }
    if (
      mode === 'create' &&
      Object.keys(allNetworks).some(value => Number(value) === network.chainId)
    ) {
      setError('chainId', 'Already exists')
    }
    if (!network.networkToken?.symbol) {
      setError('nativeTokenSymbol', 'Required')
    }
    if (!network.explorerUrl) {
      setError('explorerUrl', 'Required')
    }
    if (!isValidURL(network.explorerUrl ?? '')) {
      setError('explorerUrl', 'URL is invalid')
    }
  }

  const alert = useRef<AlertWithTextInputsHandle>(null)

  // const params = useLocalSearchParams<{
  //   address: string
  //   addressType: AddressType
  // }>()

  // TODO: ADD THIS BACK
  // useFocusEffect(
  //   useCallback(() => {
  //     if (params.address && params.addressType === title) {
  //       onUpdate(params.addressType, params.address)
  //       setParams({ address: undefined, addressType: undefined })
  //     }
  //   }, [params.address, params.addressType, title, onUpdate, setParams])
  // )

  const handleUpdate = useCallback(
    (id: string, value?: string) => {
      const updatedNetwork = { ...network, [id]: value }

      if (value === undefined) {
        showAlert({
          title: 'Do you want to delete this network?',
          description: 'This action can’t be undone',
          buttons: [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Delete'
              // onPress: () => onUpdate(updatedNetwork)
            }
          ]
        })
        return
      }

      // TODO: Add validation for type address or string
      // if (!isValidAddress({ addressType, address: value, isDeveloperMode })) {
      //   showAlert({
      //     title: 'Invalid address',
      //     description:
      //       'The address your entered is not valid for the selected chain',
      //     buttons: [
      //       {
      //         text: 'Dismiss',
      //         style: 'default'
      //       }
      //     ]
      //   })
      //   return
      // }

      setNetwork(updatedNetwork)
    },
    [network]
  )

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
              handleUpdate('chainName', values.save?.trim())
              alert.current?.hide()
            }
          }
        }
      ]
    })
  }, [handleUpdate])

  const data: AdvancedFieldProps[] = useMemo(() => {
    return [
      {
        id: 'rpcUrl',
        title: 'Network RPC URL',
        value: network.rpcUrl,
        placeholder: `Network RPC URL`,
        emptyText: `Add network RPC URL`,
        onUpdate: handleUpdate
      },
      {
        id: 'chainId',
        title: 'Chain ID',
        value: network.chainId,
        placeholder: 'Chain ID',
        emptyText: 'Add chain ID',
        onUpdate: handleUpdate
      },
      {
        id: 'nativeTokenSymbol',
        title: 'Token symbol',
        value: network.networkToken?.symbol,
        placeholder: 'Token symbol',
        emptyText: 'Add token symbol',
        onUpdate: handleUpdate
      },
      {
        id: 'nativeTokenName',
        title: 'Token name',
        value: network.networkToken?.name,
        placeholder: 'Token name',
        emptyText: 'Add token name (Optional)',
        onUpdate: handleUpdate
      },
      {
        id: 'explorerUrl',
        title: 'Explorer URL',
        value: network.explorerUrl,
        placeholder: 'Explorer URL',
        emptyText: 'Add explorer URL',
        onUpdate: handleUpdate
      }
    ]
  }, [
    handleUpdate,
    network.chainId,
    network.explorerUrl,
    network.networkToken?.name,
    network.networkToken?.symbol,
    network.rpcUrl
  ])

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
    <View sx={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          justifyContent: 'space-between'
        }}>
        <View sx={{ alignItems: 'center' }}>
          <Avatar
            backgroundColor="transparent"
            size={150}
            source={{
              uri: network.logoUri ?? ''
            }}
            hasLoading={false}
          />
          <Space y={20} />
          {renderName()}
          <Space y={47} />
        </View>
        {network && <AdvancedForm data={data} />}
      </KeyboardAwareScrollView>
      <View
        sx={{
          gap: 16,
          backgroundColor: '$surfacePrimary',
          marginBottom: insets.bottom
        }}>
        <Button
          type="primary"
          size="large"
          onPress={handleSave}
          disabled={isSaveDisabled}>
          Save
        </Button>
        <Button
          type="tertiary"
          size="large"
          onPress={() => canGoBack() && back()}>
          Cancel
        </Button>
      </View>
      <View>
        <AlertWithTextInputs ref={alert} />
      </View>
    </View>
  )
}

function isValidURL(text: string): boolean {
  let url
  try {
    url = new URL(text)
  } catch (_) {
    return false
  }
  return url.protocol === 'https:' || url.protocol === 'ipfs:'
}
