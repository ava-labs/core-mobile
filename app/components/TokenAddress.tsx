import React, { FC, useContext } from 'react'
import { ApplicationContext } from 'contexts/ApplicationContext'
import { copyToClipboard } from 'utils/DeviceTools'
import CopySVG from 'components/svg/CopySVG'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { truncateAddress } from 'utils/Utils'
import AvaButton from 'components/AvaButton'
import { noop } from 'rxjs'
import BitcoinSVG from 'components/svg/BitcoinSVG'
import { isBech32Address } from '@avalabs/bridge-sdk'
import { isAddress } from '@ethersproject/address'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'

interface Props {
  address: string
  textType?: 'Heading' | 'ButtonSmall' | 'ButtonMedium' | 'Body'
  hideCopy?: boolean
  showIcon?: boolean
  showFullAddress?: boolean
  textColor?: string
  copyIconEnd?: boolean
}

const TokenAddress: FC<Props> = ({
  address = '',
  textType = 'ButtonSmall',
  showFullAddress,
  hideCopy,
  showIcon,
  textColor,
  copyIconEnd
}) => {
  const theme = useContext(ApplicationContext).theme
  const tokenAddress = showFullAddress ? address : truncateAddress(address)
  const txtColor = textColor ? textColor : theme.colorText1

  const copyIcon = <CopySVG />

  return (
    <AvaButton.Base
      onPress={() => (hideCopy ? noop : copyToClipboard(address))}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 0
      }}>
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
            logoColor={theme.tokenLogoColor}
            backgroundColor={theme.tokenLogoBg}
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
      <TokenAddressComposed
        showFullAddress={showFullAddress}
        textColor={txtColor}
        textType={textType}
        tokenAddress={tokenAddress}
      />
      {hideCopy ||
        (copyIconEnd && (
          <>
            <Space x={8} />
            {copyIcon}
          </>
        ))}
    </AvaButton.Base>
  )
}

type TokenAddressComposedProps = {
  showFullAddress: boolean | undefined
  textType: 'Heading' | 'ButtonSmall' | 'ButtonMedium' | 'Body'
  textColor: string
  tokenAddress: string
}

const TokenAddressComposed = ({
  showFullAddress,
  textType,
  textColor,
  tokenAddress
}: TokenAddressComposedProps) => {
  switch (textType) {
    case 'ButtonSmall':
      return (
        <AvaText.ButtonSmall color={textColor}>
          {tokenAddress}
        </AvaText.ButtonSmall>
      )
    case 'ButtonMedium':
      return (
        <AvaText.ButtonMedium
          ellipsizeMode={showFullAddress ? 'middle' : undefined}
          color={textColor}>
          {tokenAddress}
        </AvaText.ButtonMedium>
      )
    case 'Heading':
      return (
        <AvaText.Heading3
          ellipsizeMode={showFullAddress ? 'middle' : undefined}
          color={textColor}>
          {tokenAddress}
        </AvaText.Heading3>
      )
    case 'Body':
      return <AvaText.Body2 color={textColor}>{tokenAddress}</AvaText.Body2>
  }

  return null
}

export default TokenAddress
