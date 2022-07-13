import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { View } from 'react-native'
import InputText from 'components/InputText'
import AvaButton from 'components/AvaButton'
import React, { useMemo, useState } from 'react'
import { popableContent } from 'screens/swap/components/SwapTransactionDetails'
import { useApplicationContext } from 'contexts/ApplicationContext'
import FlexSpacer from 'components/FlexSpacer'
import { Row } from 'components/Row'
import { BigNumber } from 'ethers'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { calculateGasAndFees } from 'utils/Utils'

interface EditFeesProps {
  gasPrice: BigNumber
  gasLimit: number
  onSave: (newGasLimit: number) => void
  onClose?: () => void
}

const EditFees = ({ gasPrice, gasLimit, onSave, onClose }: EditFeesProps) => {
  const { theme } = useApplicationContext()
  const [newGasLimit, setNewGasLimit] = useState(gasLimit)
  const tokenPrice = useNativeTokenPrice().nativeTokenPrice
  const network = useActiveNetwork()
  const [feeError, setFeeError] = useState('')
  const [newFees, setNewFees] = useState<
    ReturnType<typeof calculateGasAndFees>
  >(
    calculateGasAndFees({
      gasPrice,
      tokenPrice,
      tokenDecimals: network?.networkToken?.decimals,
      gasLimit
    })
  )

  const gasLimitInfoInfoMessage = useMemo(
    () =>
      popableContent(
        'Gas limit is the maximum units of gas you are willing to use.',
        theme.colorBg3
      ),
    [theme]
  )

  const checkCustomGasLimit = (customGasLimit: number) => {
    try {
      const fees = calculateGasAndFees({
        gasPrice,
        tokenPrice,
        tokenDecimals: network?.networkToken?.decimals,
        gasLimit: customGasLimit
      })
      setNewFees(fees)
      setNewGasLimit(customGasLimit)
      feeError && setFeeError('')
    } catch (e) {
      setFeeError('Gas Limit is too much')
    }
  }

  const handleOnSave = () => {
    if (newGasLimit) {
      onSave(newGasLimit)
      onClose?.()
    }
  }

  return (
    <View style={{ flex: 1, paddingBottom: 16 }}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 12 }}>
        Edit Gas Limit
      </AvaText.LargeTitleBold>
      <Space y={24} />
      <Row style={{ marginHorizontal: 12, alignItems: 'flex-end' }}>
        <AvaText.Heading1>{newFees.fee}</AvaText.Heading1>
        <Space x={4} />
        <AvaText.Heading3>
          {network?.networkToken?.symbol?.toUpperCase()}
        </AvaText.Heading3>
      </Row>
      <InputText
        label={'Gas Limit ⓘ'}
        mode={'amount'}
        text={newGasLimit.toString()}
        popOverInfoText={gasLimitInfoInfoMessage}
        onChangeText={text =>
          checkCustomGasLimit(parseInt(isNaN(parseInt(text)) ? '0' : text))
        }
        errorText={feeError}
      />
      <FlexSpacer />
      <AvaButton.PrimaryLarge
        style={{ marginHorizontal: 12 }}
        onPress={handleOnSave}>
        Save
      </AvaButton.PrimaryLarge>
    </View>
  )
}
export default EditFees
