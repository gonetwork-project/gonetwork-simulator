/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { Client, Message } from 'react-native-paho-mqtt';
global.Buffer = require('buffer').Buffer;
global.process = require('process');


const stateChannel= require('state-channel');
const events = require('events');
const util = require("ethereumjs-util");
const bcs = require('blockchain-service');
const message = stateChannel.message;
const sjcl = require('sjcl');
const crypto = require('crypto');

import {
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';

function createEngine(address,privateKey,blockchainService){
    var e =  new stateChannel.Engine(address, function (msg) {
      console.log("SIGNING MESSAGE");
      msg.sign(privateKey)
    },blockchainService);
    return e;
}

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' +
    'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {count:0};   

    var self = this;

    var pk1=util.toBuffer("0xb507928218b7b1e48f82270011149c56b6191cd1f2846e01c419f0a1a57acc42");
    var pk2 =util.toBuffer("0x4c65754b227fb8467715d2949555abf6fe8bcba11c6773433c8a7a05a2a1fc78");
    var pk3=util.toBuffer("0xa8344e81509696058a3c14e520693f94ce9c99c26f03310b2308a4c59b35bb3d");
    var pk4=util.toBuffer("0x157258c195ede5fad2f054b45936dae4f3e1b1f0a18e0edc17786d441a207224");

    var acct1 = "0xf0c3043550e5259dc1c838d0ea600364d999ea15";
    var acct2 = "0xb0ae572146ab8b5990e069bff487ac25635dabe8";
    var acct3 = "0xff8a018d100ace078d214f02be8df9c6944e7a2b";
    var acct4 = "0xf77e9ef93380c70c938ca2e859baa88be650d87d";
    
    var currentBlock = new util.BN(55);
    var channelAddress = util.toBuffer("0x8bf6a4702d37b7055bc5495ac302fe77dae5243b");
    var engine = createEngine(util.toBuffer(acct1),pk1);
    var engine2 = createEngine(util.toBuffer(acct4),pk4);


    engine.onNewChannel(channelAddress,
     util.toBuffer(acct1),
      new util.BN(0),
      util.toBuffer(acct4),
      new util.BN(0));
    engine2.onNewChannel(channelAddress,
      util.toBuffer(acct1),
      new util.BN(0),
      util.toBuffer(acct4),
      new util.BN(0))

    const myStorage = {
      setItem: (key, item) => {
        myStorage[key] = item;
      },
      getItem: (key) => myStorage[key],
      removeItem: (key) => {
        delete myStorage[key];
      },
    };

    engine.onDeposited(channelAddress,util.toBuffer(acct1), new util.BN(2700000));
    engine2.onDeposited(channelAddress,util.toBuffer(acct1), new util.BN(27000000));
    
    /* create mqtt client */
    var count = 0;
    const client = new Client({ uri: 'ws://test.mosquitto.org:8080/', clientId: 'clientId', storage: myStorage });
    client.on('connectionLost', (responseObject) => {
      if (responseObject.errorCode !== 0) {
        console.log(responseObject.errorMessage);
      }
    });
    client.on('messageReceived', (m) => {
      console.log("received");
      if(!m.duplicate){
        count++;
        //console.log(count++);
        //console.log(engine2.channels[channelAddress.toString("hex")].peerState.proof.transferredAmount.toString(10));
        engine2.onMessage(message.DESERIALIZE_AND_DECODE_MESSAGE(m.payloadString));
        self.increment();
      }
    });
     
    // connect the client 
    client.connect()
      .then(() => {
        // Once a connection has been made, make a subscription and send a message. 
        console.log('onConnect');
        return client.subscribe(acct4);
      })
      // .then(() => {
      //   const message = new Message('Hello');
      //   message.destinationName = 'World';
      //   client.send(message);
      // })
      .catch((responseObject) => {
        if (responseObject.errorCode !== 0) {
          console.log('onConnectionLost:' + responseObject.errorMessage);
        }
      })
    ;



  }

  increment(){
    this.setState(previousState => {
        return { count: previousState.count+1 };
      });
  }

  render() {
    let count = this.state.count;
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
         {count}
        </Text>
        <Text style={styles.instructions}>
          To get started, edit App.js
        </Text>
        <Text style={styles.instructions}>
          {instructions}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
