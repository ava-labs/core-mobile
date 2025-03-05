import React, { FC } from 'react'
import { Space } from 'components/Space'
import { truncateAddress } from 'utils/Utils'
import { noop } from 'rxjs'
import BitcoinSVG from 'components/svg/BitcoinSVG'
import { isBech32Address } from '@avalabs/core-bridge-sdk'
import { isAddress } from 'ethers'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { TouchableOpacity, useTheme, Text, Icons } from '@avalabs/k2-alpine'
import { TextVariant } from '@avalabs/k2-alpine/src/theme/tokens/text'
import { copyToClipboard } from 'common/utils/clipboard'

interface Props {
  address: string
  textVariant?: TextVariant
  hideCopy?: boolean
  showIcon?: boolean
  showFullAddress?: boolean
  textColor?: string
  copyIconEnd?: boolean
  onCopyAddress?: (address: string) => void
  testID?: string
}

const TokenAddress: FC<Props> = ({
  address = '',
  textVariant = 'buttonSmall',
  showFullAddress,
  hideCopy,
  showIcon,
  textColor,
  onCopyAddress,
  copyIconEnd
}): JSX.Element => {
  const { theme } = useTheme()

  const tokenAddress = showFullAddress ? address : truncateAddress(address)
  const txtColor = textColor ? textColor : theme.colors.$textPrimary

  const copyIcon = (
    <Icons.RecoveryMethod.Copy color={txtColor} width={16} height={16} />
  )

  const copyAddressToClipboard = (): void => {
    copyToClipboard(address)
    onCopyAddress?.(address)
  }

  return (
    <TouchableOpacity
      onPress={() => (hideCopy ? noop : copyAddressToClipboard())}
      style={{
        flexDirection: 'row',
        alignItems: 'center'
      }}
      testID="receive_token_address">
      {showIcon && isBech32Address(address) && (
        <>
          <BitcoinSVG size={16} />
          <Space x={8} />
        </>
      )}
      {showIcon && isAddress(address) && (
        <>
          <AvaLogoSVG
            size={16}
            logoColor={theme.colors.$textPrimary}
            backgroundColor={theme.colors.$surfaceSecondary}
          />
          <Space x={8} />
        </>
      )}
      {hideCopy || copyIconEnd || (
        <>
          {copyIcon}
          <Space x={4} />
        </>
      )}
      <Text
        variant={textVariant}
        ellipsizeMode={showFullAddress ? 'middle' : undefined}
        sx={{ color: txtColor }}
        testID="account_address">
        {tokenAddress}
      </Text>
      {hideCopy ||
        (copyIconEnd && (
          <>
            <Space x={4} />
            {copyIcon}
          </>
        ))}
    </TouchableOpacity>
  )
}

export default TokenAddress
