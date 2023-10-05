import React, {
  Reducer,
  useCallback,
  useEffect,
  useReducer,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AvaButton from 'components/AvaButton'
import { ScrollView } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import FlexSpacer from 'components/FlexSpacer'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import InputText from 'components/InputText'
import { addCustomNetwork, selectAllNetworks } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export type AddEditNetworkProps = {
  mode: 'edit' | 'create'
  network?: Network
  onClose?: () => void
}

const errorsInitialState = {
  rpcUrl: '',
  networkName: '',
  chainId: '',
  nativeTokenSymbol: '',
  explorerUrl: ''
} as const
type Errors = typeof errorsInitialState

export default function AddEditNetwork({
  mode,
  network,
  onClose
}: AddEditNetworkProps): JSX.Element {
  const dispatch = useDispatch()
  const isTestnet = useSelector(selectIsDeveloperMode)
  const allNetworks = useSelector(selectAllNetworks)

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

  const save = (): void => {
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
    onClose?.()
  }

  return (
    <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
      <AvaText.LargeTitleBold>
        {mode === 'edit' ? 'Edit Network' : 'Add Network'}
      </AvaText.LargeTitleBold>
      <Space y={16} />
      <DetailItem
        title={'Network RPC URL'}
        value={rpcUrl}
        error={getError('rpcUrl')}
        onChange={value => setRpcUrl(value)}
      />
      <Space y={8} />
      <DetailItem
        title={'Network Name'}
        value={networkName.toString()}
        error={getError('networkName')}
        onChange={value => setNetworkName(value)}
      />
      <Space y={8} />
      <DetailItem
        title={'Chain ID'}
        value={chainId.toString()}
        error={getError('chainId')}
        onChange={value => setChainId(value)}
      />
      <Space y={8} />
      <DetailItem
        title={'Native Token Symbol'}
        value={nativeTokenSymbol}
        error={getError('nativeTokenSymbol')}
        onChange={value => setNativeTokenSymbol(value)}
      />
      <DetailItem
        title={'Native Token Name (Optional)'}
        value={nativeTokenName}
        onChange={value => setNativeTokenName(value)}
      />
      <Space y={8} />
      <DetailItem
        title={'Explorer URL'}
        value={explorerUrl}
        error={getError('explorerUrl')}
        onChange={value => setExplorerUrl(value)}
      />
      <Space y={8} />
      <DetailItem
        title={'Logo URL (Optional)'}
        value={logoUri}
        onChange={value => setLogoUri(value)}
      />
      <FlexSpacer minHeight={24} />
      <AvaButton.PrimaryLarge onPress={save}>Save</AvaButton.PrimaryLarge>
    </ScrollView>
  )
}

function DetailItem({
  title,
  value,
  onChange,
  error
}: {
  title: string
  value: string
  onChange: (value: string) => void
  error?: string
}): JSX.Element {
  return (
    <InputText
      label={title}
      text={value}
      errorText={error}
      onChangeText={onChange}
      style={{ marginHorizontal: 0 }}
    />
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
