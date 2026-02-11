import React, { useMemo, useCallback } from 'react'
import {
  GroupList,
  useTheme,
  TouchableOpacity,
  Text,
  View,
  SCREEN_WIDTH
} from '@avalabs/k2-alpine'
import { Account } from 'store/account'
import { copyToClipboard } from 'common/utils/clipboard'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { useCombinedPrimaryNetworks } from 'common/hooks/useCombinedPrimaryNetworks'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { isXPChain } from 'utils/network/isAvalancheNetwork'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { WalletType } from 'services/wallet/types'
import { useSelector } from 'react-redux'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { useRouter } from 'expo-router'

export const AccountAddresses = ({
  account
}: {
  account: Account
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const activeWallet = useActiveWallet()
  const { networks } = useCombinedPrimaryNetworks({ hideEmptySolana: false })
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)

  const isMissingSolanaAddress = useMemo(
    () => account?.addressSVM === undefined || account?.addressSVM.length === 0,
    [account?.addressSVM]
  )

  const isLedger = useMemo(() => {
    return (
      activeWallet.type === WalletType.LEDGER_LIVE ||
      activeWallet.type === WalletType.LEDGER
    )
  }, [activeWallet.type])

  const onCopyAddress = useCallback((value: string, message: string): void => {
    copyToClipboard(value, message)
  }, [])

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const data = useMemo(() => {
    return networks
      .map(network => {
        const address = (() => {
          switch (network.vmName) {
            case NetworkVMType.AVM:
            case NetworkVMType.PVM:
              return account.addressPVM
                ? stripAddressPrefix(account.addressPVM)
                : undefined
            case NetworkVMType.BITCOIN:
              return account.addressBTC
            case NetworkVMType.EVM:
              return account.addressC
            case NetworkVMType.SVM:
              return account.addressSVM
            default:
              return undefined
          }
        })()

        if (network.vmName === NetworkVMType.SVM && isSolanaSupportBlocked) {
          return undefined
        }

        return {
          subtitle: address
            ? truncateAddress(address, TRUNCATE_ADDRESS_LENGTH)
            : '',
          title: network.chainName,
          leftIcon: (
            <NetworkLogoWithChain
              network={network}
              networkSize={36}
              outerBorderColor={colors.$surfaceSecondary}
              showChainLogo={isXPChain(network.chainId)}
            />
          ),
          value:
            isLedger &&
            network.vmName === NetworkVMType.SVM &&
            (address === undefined || address === '') &&
            !isSolanaSupportBlocked ? (
              <SolanaEnableButton accountId={account.id} />
            ) : (
              <CopyButton
                testID={`copy_btn__${network.chainName}`}
                onPress={() =>
                  address &&
                  onCopyAddress(address, `${network.chainName} address copied`)
                }
              />
            )
        }
      })
      .filter(item => item !== undefined)
  }, [
    networks,
    isSolanaSupportBlocked,
    colors.$surfaceSecondary,
    isLedger,
    account.id,
    account.addressPVM,
    account.addressBTC,
    account.addressC,
    account.addressSVM,
    onCopyAddress
  ])

  return (
    <View sx={{ gap: 12 }}>
      <GroupList
        data={data}
        titleSx={{
          fontSize: 15,
          lineHeight: 18,
          fontFamily: 'Inter-Medium'
        }}
        subtitleSx={{ fontSize: 13, lineHeight: 18 }}
        textContainerSx={{
          width: SCREEN_WIDTH * 0.4
        }}
        valueSx={{
          fontSize: 16,
          lineHeight: 22
        }}
      />
    </View>
  )
}

const CopyButton = ({
  onPress,
  testID
}: {
  onPress: () => void
  testID?: string
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View style={{ marginLeft: 16 }}>
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: colors.$borderPrimary,
          paddingHorizontal: 17,
          paddingVertical: 5,
          borderRadius: 17
        }}>
        <Text
          testID={testID}
          variant="buttonMedium"
          sx={{ fontSize: 14 }}
          numberOfLines={1}>
          Copy
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const SolanaEnableButton = ({
  accountId
}: {
  accountId: string
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { navigate } = useRouter()

  const handleOnPress = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/solanaConnection', params: { accountId } })
  }, [navigate, accountId])

  return (
    <View style={{ marginLeft: 16 }}>
      <TouchableOpacity
        onPress={handleOnPress}
        style={{
          backgroundColor: colors.$borderPrimary,
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 17
        }}>
        <Text
          testID={'copy_btn__solana'}
          variant="buttonMedium"
          sx={{ fontSize: 14 }}
          numberOfLines={1}>
          Enable
        </Text>
      </TouchableOpacity>
    </View>
  )
}
