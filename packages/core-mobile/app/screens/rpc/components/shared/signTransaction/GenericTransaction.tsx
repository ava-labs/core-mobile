import { TransactionDisplayValues } from 'screens/rpc/util/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import React, { useEffect, useState } from 'react'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import { View } from 'react-native'
import { Space } from 'components/Space'
import { useSelector } from 'react-redux'
import { selectAccountByAddress } from 'store/account'
import { isContractAddress } from 'utils/isContractAddress'
import { Network } from '@avalabs/chains-sdk'
import Logger from 'utils/Logger'
import { sharedStyles } from './styles'

export function GenericTransaction({
  description,
  fromAddress,
  toAddress,
  network
}: TransactionDisplayValues & { network?: Network }): JSX.Element {
  const theme = useApplicationContext().theme
  const account = useSelector(selectAccountByAddress(fromAddress))
  const [isToAddressContract, setIsToAddressContract] = useState(false)

  useEffect(() => {
    if (description?.args?.asset) {
      return setIsToAddressContract(true)
    }

    if (toAddress && network) {
      isContractAddress(toAddress, network)
        .then(setIsToAddressContract)
        .catch(Logger.error)
    }
  }, [toAddress, description?.args?.asset, network])

  return (
    <>
      <View
        style={[
          sharedStyles.info,
          {
            backgroundColor: theme.colorBg3
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3 color={theme.colorText1}>Account</AvaText.Body3>
          <AvaText.Body3 color={theme.colorText1}>
            {account?.name}
          </AvaText.Body3>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>
            {isToAddressContract ? 'Contract' : 'To'}
          </AvaText.Body3>
          <TokenAddress address={description?.args?.asset ?? toAddress} />
        </Row>
      </View>
    </>
  )
}
