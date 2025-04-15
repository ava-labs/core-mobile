import { isBech32Address } from '@avalabs/core-bridge-sdk'
import { Button, Text, useTheme } from '@avalabs/k2-alpine'
import { isAddress } from 'ethers'
import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { noop } from 'rxjs'
import { selectActiveNetwork } from 'store/network'
import { copyToClipboard } from 'utils/DeviceTools'
import { isBtcAddress as isValidBtcAddress } from 'utils/isBtcAddress'
import { truncateAddress } from 'utils/Utils'

type TextType = 'Heading' | 'ButtonSmall' | 'ButtonMedium' | 'Body1' | 'Body2'

interface Props {
  address: string
  textType?: TextType
  hideCopy?: boolean
  showIcon?: boolean
  showFullAddress?: boolean
  textColor?: string
  copyIconEnd?: boolean
  onCopyAddress?: (address: string) => void
  testID?: string
}

export const TokenAddress: FC<Props> = ({
  address = '',
  textType = 'ButtonSmall',
  showFullAddress,
  hideCopy,
  showIcon,
  textColor,
  onCopyAddress,
  copyIconEnd
}): JSX.Element => {
  const { theme } = useTheme()
  const activeNetwork = useSelector(selectActiveNetwork)
  const tokenAddress = showFullAddress ? address : truncateAddress(address)
  const txtColor = textColor ? textColor : theme.colors.$textPrimary

  const copyIcon = <></>

  const copyAddressToClipboard = (): void => {
    copyToClipboard(address)
    onCopyAddress?.(address)
  }

  const isBtcAddress = (): boolean =>
    isValidBtcAddress(address, !activeNetwork.isTestnet)

  return (
    <Button
      onPress={() => (hideCopy ? noop : copyAddressToClipboard())}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 0
      }}
      testID="receive_token_address">
      {showIcon && isBtcAddress() && <>{/* <BitcoinSVG size={16} /> */}</>}
      {showIcon && (isBech32Address(address) || isAddress(address)) && (
        <>
          {/* <AvaLogoSVG
            size={16}
            logoColor={theme.colors.$textPrimary}
            backgroundColor={theme.colors.$surfacePrimary}
          /> */}
        </>
      )}
      {hideCopy || copyIconEnd || <>{copyIcon}</>}
      <TokenAddressComposed
        showFullAddress={showFullAddress}
        textColor={txtColor}
        textType={textType}
        tokenAddress={tokenAddress}
      />
      {hideCopy || (copyIconEnd && <>{copyIcon}</>)}
    </Button>
  )
}

type TokenAddressComposedProps = {
  showFullAddress: boolean | undefined
  textType: TextType
  textColor: string
  tokenAddress: string
  testID?: string
}

const TokenAddressComposed = ({
  showFullAddress,
  textType,
  textColor,
  tokenAddress
}: TokenAddressComposedProps): JSX.Element | null => {
  switch (textType) {
    case 'ButtonSmall':
      return (
        <Button size="small" testID="account_address">
          {tokenAddress}
        </Button>
      )
    case 'ButtonMedium':
      return (
        <Button size="medium" testID="account_address">
          {tokenAddress}
        </Button>
      )
    case 'Heading':
      return (
        <Text
          ellipsizeMode={showFullAddress ? 'middle' : undefined}
          color={textColor}>
          {tokenAddress}
        </Text>
      )
    case 'Body1':
      return <Text color={textColor}>{tokenAddress}</Text>
    case 'Body2':
      return <Text color={textColor}>{tokenAddress}</Text>
    default:
      return null
  }
}
