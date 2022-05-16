import React, { FC, useContext } from 'react'
import { ApplicationContext } from 'contexts/ApplicationContext'
import { copyToClipboard } from 'utils/DeviceTools'
import CopySVG from 'components/svg/CopySVG'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import { truncateAddress } from 'utils/Utils'
import AvaButton from 'components/AvaButton'
import { noop } from 'rxjs'

interface Props {
  address: string
  textType?: 'Heading' | 'ButtonSmall' | 'ButtonMedium' | 'Body'
  hideCopy?: boolean
  showFullAddress?: boolean
  color?: string
  copyIconEnd?: boolean
}

const TokenAddress: FC<Props> = ({
  address = '',
  textType = 'ButtonSmall',
  showFullAddress,
  hideCopy,
  color,
  copyIconEnd
}) => {
  const theme = useContext(ApplicationContext).theme
  const tokenAddress = showFullAddress ? address : truncateAddress(address)

  const TokenAddressComposed = () => {
    switch (textType) {
      case 'ButtonSmall':
        return (
          <AvaText.ButtonSmall color={color ? color : theme.colorText1}>
            {tokenAddress}
          </AvaText.ButtonSmall>
        )
      case 'ButtonMedium':
        return (
          <AvaText.ButtonMedium
            ellipsizeMode={showFullAddress ? 'middle' : undefined}
            color={color ? color : theme.colorText1}>
            {tokenAddress}
          </AvaText.ButtonMedium>
        )
      case 'Heading':
        return (
          <AvaText.Heading3
            ellipsizeMode={showFullAddress ? 'middle' : undefined}
            color={color ? color : theme.colorText1}>
            {tokenAddress}
          </AvaText.Heading3>
        )
      case 'Body':
        return (
          <AvaText.Body2 color={color ? color : theme.colorText1}>
            {tokenAddress}
          </AvaText.Body2>
        )
    }
  }

  return (
    <AvaButton.Base
      onPress={() => (hideCopy ? noop : copyToClipboard(address))}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 0
      }}>
      {hideCopy || copyIconEnd || (
        <>
          <CopySVG color={color ? color : theme.colorText1} size={16} />
          <Space x={8} />
        </>
      )}
      <TokenAddressComposed />
      {hideCopy ||
        (copyIconEnd && (
          <>
            <Space x={8} />
            <CopySVG color={color ? color : theme.colorText1} size={16} />
          </>
        ))}
    </AvaButton.Base>
  )
}

export default TokenAddress
