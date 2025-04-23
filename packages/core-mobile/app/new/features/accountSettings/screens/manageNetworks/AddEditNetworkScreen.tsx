import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { Button, View } from '@avalabs/k2-alpine'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { NetworkForm } from 'features/accountSettings/components/NetworkForm'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, {
  Reducer,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
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
  const { allNetworks } = useNetworks()
  const dispatch = useDispatch()

  const { canGoBack, back } = useRouter()
  const { networkId } = useLocalSearchParams<{ networkId: string }>()
  const [network, setNetwork] = useState<Network>({ id: networkId, name: '' })

  const handleUpdateNetwork = (updated: Network): void => {
    setNetwork(updated)
  }

  const isSaveDisabled = useMemo(() => {
    return (
      (network.rpcUrl === undefined &&
        network.chainName === undefined &&
        network.chainId === undefined) ||
      network.chainName.length === 0
    )
  }, [network])

  const handleSave = useCallback(() => {
    // dispatch(addContact({ ...contact, id: contactId }))
    setShowErrors(true)
    if (hasErrors()) return

    const customNetwork: Network = {
      chainId: Number.parseInt(chainId),
      chainName: networkName,
      description: '',
      explorerUrl,
      isTestnet,
      logoUri,
      mainnetChainId: 0,
      networkToken: {
        symbol: nativeTokenSymbol,
        name: nativeTokenName,
        description: '',
        decimals: 18,
        logoUri: ''
      },
      platformChainId: '',
      rpcUrl,
      subnetId: '',
      vmId: '',
      vmName: NetworkVMType.EVM
    }
    dispatch(addCustomNetwork(customNetwork))
    canGoBack() && back()
  }, [back, canGoBack, network, networkId, dispatch])

  const insets = useSafeAreaInsets()

  const isTestnet = useSelector(selectIsDeveloperMode)

  const [rpcUrl, setRpcUrl] = useState(network?.rpcUrl ?? '')
  const [networkName, setNetworkName] = useState(network?.chainName ?? '')
  const [chainId, setChainId] = useState(network?.chainId?.toString() ?? '')
  const [nativeTokenSymbol, setNativeTokenSymbol] = useState(
    network?.networkToken?.symbol ?? ''
  )
  const [nativeTokenName, setNativeTokenName] = useState(
    network?.networkToken?.name ?? ''
  )
  const [explorerUrl, setExplorerUrl] = useState(network?.explorerUrl ?? '')
  const [logoUri, setLogoUri] = useState(network?.logoUri ?? '')

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

  function hasErrors(): boolean {
    return Object.values(_errors).some(e => e)
  }

  useEffect(validateInputs, [
    allNetworks,
    chainId,
    explorerUrl,
    mode,
    nativeTokenName,
    nativeTokenSymbol,
    networkName,
    rpcUrl,
    setError
  ])

  function validateInputs(): void {
    _dispatchErrors('reset')
    if (!rpcUrl) {
      setError('rpcUrl', 'Required')
    }
    if (!isValidURL(rpcUrl)) {
      setError('rpcUrl', 'URL is invalid')
    }
    if (!networkName) {
      setError('networkName', 'Required')
    }
    if (!chainId || isNaN(Number.parseInt(chainId))) {
      setError('chainId', 'Must be a number')
    }
    if (chainId === '0') {
      setError('chainId', 'Cannot be 0')
    }
    if (
      mode === 'create' &&
      Object.keys(allNetworks).some(value => value === chainId)
    ) {
      setError('chainId', 'Already exists')
    }
    if (!nativeTokenSymbol) {
      setError('nativeTokenSymbol', 'Required')
    }
    if (!explorerUrl) {
      setError('explorerUrl', 'Required')
    }
    if (!isValidURL(explorerUrl)) {
      setError('explorerUrl', 'URL is invalid')
    }
  }

  return (
    <View sx={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          justifyContent: 'space-between'
        }}>
        {network && (
          <NetworkForm network={network} onUpdate={handleUpdateNetwork} />
        )}
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
      {/* <DetailItem
      title={'Network RPC URL'}
      value={rpcUrl}
      error={getError('rpcUrl')}
      onChange={value => setRpcUrl(value)}
      testID="networkRpcUrl"
    />
    <DetailItem
      title={'Network Name'}
      value={networkName.toString()}
      error={getError('networkName')}
      onChange={value => setNetworkName(value)}
      testID="networkName"
    />
    <DetailItem
      title={'Chain ID'}
      value={chainId.toString()}
      error={getError('chainId')}
      onChange={value => setChainId(value)}
      testID="chainId"
    />
    <DetailItem
      title={'Native Token Symbol'}
      value={nativeTokenSymbol}
      error={getError('nativeTokenSymbol')}
      onChange={value => setNativeTokenSymbol(value)}
      testID="nativeTokenSymbol"
    />
    <DetailItem
      title={'Native Token Name (Optional)'}
      value={nativeTokenName}
      onChange={value => setNativeTokenName(value)}
      testID="nativeTokenName"
    />
    <DetailItem
      title={'Explorer URL'}
      value={explorerUrl}
      error={getError('explorerUrl')}
      onChange={value => setExplorerUrl(value)}
      testID="explorerUrl"
    />
    <DetailItem
      title={'Logo URL (Optional)'}
      value={logoUri}
      onChange={value => setLogoUri(value)}
      testID="logoUri"
    /> */}
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
