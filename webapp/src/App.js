import React, { Component } from 'react';
import {Route, Switch,Redirect} from 'react-router';
import {Main} from './Main';
import {Start} from './Start';

class App extends Component {
  constructor(props) {
    super(props);
    localStorage.setItem("version", 2)
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
        <Route path="/chat/:url" component={Main}/>
        <Redirect path="/chat" to="/"/>
        <Route component={Start}/>
      </Switch>
    )
  }
}

export default App;