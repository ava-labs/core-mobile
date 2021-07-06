import React, {Component} from "react"
import {StyleSheet, View} from "react-native"
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"

type Props = {
  keyNum: number
  text: string
  editable: boolean
  onChangeText?: (text: string) => void
}
type State = {}

class MnemonicInput extends Component<Props, State> {

  constructor(props: Props | Readonly<Props>) {
    super(props)
  }

  componentDidMount(): void {
  }

  render(): Element {
    return (
      <View style={styles.horizontalLayout} >
        <InputText value={this.props.text}  style={{flexGrow: 1}}
                   editable={this.props.editable} onChangeText={this.props.onChangeText}/>
        <View style={styles.superscript}>
          <TextTitle text={(this.props.keyNum + 1).toString()} size={10}/>
        </View>
      </View>
    )
  }
}

const styles: any = StyleSheet.create({
    superscript: {
      position: 'absolute',
      end: 14,
      top: 14,
    },
    horizontalLayout: {
      flexDirection: 'row',
      alignItems: "center",
      width: 116,
    },
  }
)
export default MnemonicInput
