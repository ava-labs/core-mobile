import React, { FC, ReactElement, useEffect, useMemo, useState } from 'react'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'
import { StyleSheet } from 'react-native'

export type RadioGroupProps = {
  onSelected: (selectedKey: string) => void
  preselectedKey?: string
}
const RadioGroup: FC<RadioGroupProps> = ({
  onSelected,
  preselectedKey = '',
  children
}: RadioGroupProps) => {
  const { theme } = useApplicationContext()
  const [selected, setSelected] = useState(preselectedKey)

  useEffect(() => {
    onSelected(selected)
  }, [onSelected, selected])

  const wrapped = useMemo(() => {
    return (children as ReactElement[]).map((child, index) => {
      if (!child.key) {
        throw Error('children must define key')
      }
      const clone = React.cloneElement(child, {
        color: selected === child.key ? theme.colorBg2 : theme.colorIcon2
      })
      return (
        <AvaButton.Base
          key={index}
          onPress={() => {
            setSelected(child.key!.toString())
          }}
          style={[
            styles.button,
            {
              borderTopLeftRadius: index === 0 ? 4 : 0,
              borderBottomLeftRadius: index === 0 ? 4 : 0,
              borderTopRightRadius: index === children.length - 1 ? 4 : 0,
              borderBottomRightRadius: index === children.length - 1 ? 4 : 0,
              backgroundColor:
                selected === child.key ? theme.colorIcon1 : theme.colorBg3
            }
          ]}>
          {clone}
        </AvaButton.Base>
      )
    })
  }, [children, selected])

  return <Row>{wrapped}</Row>
}

export default RadioGroup

const styles = StyleSheet.create({
  button: {
    height: 28,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
