import React, {Component} from "react"
import {Appearance, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import Dialog from "react-native-dialog"

type Props = {
  onCancel: () => void
  onOk: (password?: string) => void
}
type State = {
  isDarkMode: boolean,
  password: string
}

class PasswordInput extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      password: ""
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
  }

  private onSubmit = (): void => {
    this.props.onOk(this.state.password)
  }

  render(): Element {
    let THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    return (
      <View>
        <Dialog.Container visible>
          <Dialog.Title>Password</Dialog.Title>
          <Dialog.Description>
            Enter password
          </Dialog.Description>
          <Dialog.Input blurOnSubmit onSubmitEditing={this.onSubmit}
                        onChangeText={(text: string) => this.setState({password: text})}/>
          <Dialog.Button label="Cancel" onPress={() => {
            this.props.onCancel()
          }}/>
          <Dialog.Button label="Ok" onPress={() => {
            this.onSubmit()
          }}/>
        </Dialog.Container>
      </View>
    )
  }
}

const styles = StyleSheet.create({})

export default PasswordInput
