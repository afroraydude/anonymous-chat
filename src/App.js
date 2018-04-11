import React, { Component } from 'react';
import {Route, Switch,Redirect} from 'react-router';
import {Main} from './Main';
import {Start} from './Start';
import {DesktopConfirm} from './DesktopConfirm';
import {createSign, getHashes} from 'crypto-browserify';
import { Embed } from './Embed';
import { Legal } from './Legal';

var keypair = require('keypair')

var genkeys = function() {
  var pair = keypair();
  return pair || {public: "fail", private: "fail"}
}

class App extends Component {
  constructor(props) {
    super(props);
    localStorage.setItem("version", 12.3);

    if (!localStorage.getItem("pubkey") || !localStorage.getItem("privkey")) {
      var keypair = genkeys();
      localStorage.setItem('pubkey', keypair.public)
      localStorage.setItem('privkey', keypair.private)
    }

    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    }
    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== "denied" && Notification.permission !== "granted") {
      Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
        if (permission === "granted") {
          var notification = new Notification("Thanks for enabling!");
        }
      });
    }
  }
  render() {
    return (
      <Switch>
        <Route path="/chat/:url" exact={true} component={Main}/>
        <Route path="/chat/:url/confirm" component={DesktopConfirm}/>
        <Route path="/chat/:url/embed" component={Embed}/>
            {
                // TODO: Server owner login
            }
        <Route path="/legal" component={Legal}/>
        <Route component={Start}/>
      </Switch>
    )
  }
}

export default App;
