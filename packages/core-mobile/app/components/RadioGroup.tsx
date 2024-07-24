import React, {
  FC,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState
} from 'react'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'
import { StyleSheet } from 'react-native'

export type RadioGroupProps = {
  onSelected: (selectedKey: string) => void
  preselectedKey?: string
}
const RadioGroup: FC<RadioGroupProps & PropsWithChildren> = ({
  onSelected,
  preselectedKey = '',
  children
}) => {
  const { theme } = useApplicationContext()
  const [selected, setSelected] = useState(preselectedKey)

  useEffect(() => {
    onSelected(selected)
  }, [onSelected, selected])

  const wrapped = useMemo(() => {
    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return null

      if (!child.key) {
        throw Error('children must define key')
      }

      const clone = React.cloneElement(child, {
        // @ts-expect-error color is a valid prop
        color: selected === child.key ? theme.colorBg2 : theme.colorIcon2
      })

      const leftRadius = index === 0 ? 4 : 0
      const rightRadius = index === React.Children.count(children) - 1 ? 4 : 0

      return (
        <AvaButton.Base
          key={index}
          onPress={() => {
            child.key && setSelected(child.key.toString())
          }}
          style={[
            styles.button,
            {
              borderTopLeftRadius: leftRadius,
              borderBottomLeftRadius: leftRadius,
              borderTopRightRadius: rightRadius,
              borderBottomRightRadius: rightRadius,
              backgroundColor:
                selected === child.key ? theme.colorIcon1 : theme.colorBg3
            }
          ]}>
          {clone}
        </AvaButton.Base>
      )
    })
  }, [
    children,
    selected,
    theme.colorBg2,
    theme.colorBg3,
    theme.colorIcon1,
    theme.colorIcon2
  ])

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
