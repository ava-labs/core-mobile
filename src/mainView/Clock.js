import React, {Component} from 'react';
import {Appearance, StyleSheet, Text} from 'react-native';
import {interval, Subscription} from 'rxjs';
import {retry} from 'rxjs/operators';
import moment from 'moment';
import {Colors} from 'react-native/Libraries/NewAppScreen';

class Clock extends Component {
  disposable: Subscription;

  constructor() {
    super();
    this.state = {
      currentTime: moment().format('HH:mm:ss'),
    };
  }
  componentDidMount() {
    this.disposable = interval(1000)
      .pipe(retry())
      .subscribe({
        next: () => {
          this.setState({
            currentTime: moment().format('HH:mm:ss'),
          });
        },
        error: err => console.log(err),
      });
  }
  componentWillUnmount() {
    this.disposable.unsubscribe();
  }

  render() {
    const isDarkMode = Appearance.getColorScheme() === 'dark';
    return (
      <Text
        style={[
          styles.text,
          {color: isDarkMode ? Colors.white : Colors.black},
        ]}>
        {this.state.currentTime}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
    marginEnd: 20,
  },
});

export default Clock;
