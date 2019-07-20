import React from 'react';
import Constants from 'react';
import { StyleSheet, Text, TextInput, Button, View } from 'react-native';


const server = '80.93.177.192'

export default function App() {
  state = {text: ''}
  handleClick = (e) => {
    return fetch('http://${server}/words/?word=${this.state}&langTo=russian&langFrom=kalmyk')
  }
  return (
    <View style={styles.container}>
        <Text style={styles.paragraph}>
          Введите слово
        </Text>
        <TextInput
          style={styles.input}
          editable={true}
          maxLength={40}
          placeholder={'Введите слово'}
          onChangeText={(v) => this.setState({text: v + ''})}
          value={this.state.text}
        />
        <View style={styles.viewButton}>
          <Button
            style={styles.button}
            title='Ok'
            onPress={this.handleClick}
          >
          </Button>
        </View>


    </View>
  )
}

const styles = StyleSheet.create({
  container: {

    marginVertical: 15,
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#fff',
    padding: 8,
  },
  card: {
    margin: 14,
  },
  paragraph: {
    margin: 14,
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    margin: 14,
    height: 50,
    fontSize: 25,
    fontFamily: 'sans-serif',
    backgroundColor: '#edeef0',

  },
  output: {
    margin: 14,
  },
  viewButton: {
    margin: 14,
  },
});
