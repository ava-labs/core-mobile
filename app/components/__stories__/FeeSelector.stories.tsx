import { storiesOf } from '@storybook/react-native'
import { FeeSelector } from 'components/NetworkFeeSelector'
import React, { FC, useState } from 'react'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import InputText from 'components/InputText'
import { TextInput } from 'react-native'
import { bnToEthersBigNumber, stringToBN } from '@avalabs/utils-sdk'
import Logger from 'utils/Logger'
import {BigNumber} from 'ethers';

storiesOf('Confirmation Tracker', module).add('Normal', () => <Container />)

const Container: FC = () => {
  const theme = useApplicationContext().theme
  const [selected, setSelected] = useState(false)
  const [testString, setTextString] = useState('34.34')
  const testInput = Math.round(parseInt(testString)).toString()
  return (
    <Row
      style={{
        justifyContent: 'space-between',
        backgroundColor: theme.background,
        padding: 32,
        flex: 1
      }}>
      <FeeSelector
        label={'Normal'}
        selected={selected}
        value={testInput}
        onSelect={() => setSelected(!selected)}
      />
      <FeeSelector
        label={'Custom'}
        selected={selected}
        value={testInput}
        onSelect={() => setSelected(!selected)}>
        <TextInput
          value={testInput}
          autoFocus
          keyboardType={'numeric'}
          onChangeText={text => {
            const singleMethod = BigNumber.from(text).mul(10 ** 9)
            const tx = bnToEthersBigNumber(
              stringToBN(text === '' ? '0.0' : text, 9)
            )
            Logger.warn('from Method', tx.toNumber())
            Logger.warn('other Method', tx.toNumber())
            setTextString(text)
          }}
        />
      </FeeSelector>
    </Row>
  )
}
