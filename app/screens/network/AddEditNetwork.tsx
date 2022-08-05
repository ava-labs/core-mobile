import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AvaButton from 'components/AvaButton'
import { ScrollView, View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import FlexSpacer from 'components/FlexSpacer'
import { Network, NetworkToken, NetworkVMType } from '@avalabs/chains-sdk'
import InputText from 'components/InputText'
import { addCustomNetwork, selectNetworks } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export type AddEditNetworkProps = {
  mode: 'edit' | 'create'
  network?: Network
  onClose?: () => void
}

export default function AddEditNetwork({
  mode,
  network,
  onClose
}: AddEditNetworkProps) {
  const dispatch = useDispatch()
  const isTestnet = useSelector(selectIsDeveloperMode)
  const allNetworks = useSelector(selectNetworks)

  const [dataValid, setDataValid] = useState(false)
  const [rpcUrl, setRpcUrl] = useState(network?.rpcUrl ?? '')
  const [networkName, setNetworkName] = useState(network?.chainName ?? '')
  const [chainId, setChainId] = useState(network?.chainId?.toString() ?? '')
  const [chainIdError, setChainIdError] = useState('')
  const [nativeTokenName, setNativeTokenName] = useState(
    network?.networkToken?.name ?? ''
  )
  const [explorerUrl, setExplorerUrl] = useState(network?.explorerUrl ?? '')

  useEffect(validateInputs, [
    allNetworks,
    chainId,
    nativeTokenName,
    networkName,
    rpcUrl
  ])

  function validateInputs() {
    let isValid = true
    if (!rpcUrl) {
      setDataValid(false)
      isValid = false
    }
    if (!networkName) {
      setDataValid(false)
      isValid = false
    }
    if (!chainId || isNaN(Number.parseInt(chainId, 10))) {
      setDataValid(false)
      isValid = false
    }
    if (Object.keys(allNetworks).some(value => value === chainId)) {
      setChainIdError('Already exists')
      setDataValid(false)
      isValid = false
    } else {
      setChainIdError('')
    }
    if (!nativeTokenName) {
      setDataValid(false)
      isValid = false
    }

    if (isValid) {
      setDataValid(true)
    }
  }

  const save = () => {
    const customNetwork = {
      isTestnet,
      chainId: Number.parseInt(chainId, 10),
      networkToken: {
        symbol: nativeTokenName,
        name: nativeTokenName
      } as NetworkToken,
      explorerUrl,
      chainName: networkName,
      rpcUrl,
      vmName: NetworkVMType.EVM,
      logoUri: '',
      mainnetChainId: 0,
      platformChainId: '',
      subnetId: '',
      vmId: '',
      description: ''
    } as Network
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
        onChange={value => setRpcUrl(value)}
      />
      <Space y={8} />
      <DetailItem
        title={'Network Name'}
        value={networkName.toString()}
        onChange={value => setNetworkName(value)}
      />
      <Space y={8} />
      <DetailItem
        title={'Chain ID'}
        value={chainId.toString()}
        error={chainIdError}
        onChange={value => setChainId(value)}
      />
      <Space y={8} />
      <DetailItem
        title={'Native Token'}
        value={nativeTokenName}
        onChange={value => setNativeTokenName(value)}
      />
      <Space y={8} />
      <DetailItem
        title={'Explorer URL (Optional)'}
        value={explorerUrl}
        onChange={value => setExplorerUrl(value)}
      />
      <FlexSpacer />
      <AvaButton.PrimaryLarge disabled={!dataValid} onPress={save}>
        Save
      </AvaButton.PrimaryLarge>
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
}) {
  return (
    <View style={{ marginHorizontal: -8 }}>
      <InputText
        label={title}
        text={value}
        errorText={error}
        onChangeText={onChange}
      />
    </View>
  )
}
