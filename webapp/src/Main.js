import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import openSocket from 'socket.io-client';
import {createCipher} from 'crypto-browserify';
import {Table, Input, Button, Form, FormGroup, Navbar, NavbarBrand} from 'reactstrap';

  const b64DecodeUnicode = function(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

export class Main extends Component {
  constructor(props) {
    super(props);
    console.log(this.props.match.params.url)
    const url = this.props.match.params.url;
    console.log(b64DecodeUnicode(url));
    const socket = openSocket(b64DecodeUnicode(url));
    this.state = {url: b64DecodeUnicode(url), screen: "init", input: "", id: "", color: "", crypto: "", status: "connecting", iosocket: socket, messages: [], messageView: <div></div>}
    
    this.updateMessages = this.updateMessages.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.handleTextTyping = this.handleTextTyping.bind(this);
    socket.on("version", function(v) {
      if (v > parseInt(localStorage.getItem("version"))) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
        localStorage.setItem('updated', 'true');
        window.location.reload();
      } else {
        if(localStorage.getItem('updated') === 'true') {
          this.setState({updated: true});
          localStorage.removeItem('updated');
        }
      }
    }.bind(this))
    socket.on("identification", function(identification) {
      console.log(identification);
      this.setState({id: identification.id, color: identification.color, crypto: identification.crypto, status: "getting messages"});
    }.bind(this));
    socket.on("messagelist", function(data) {
      console.log(data);
      this.setState({messages: data, status: "connected"});
      this.updateMessages();
    }.bind(this))
    socket.on("notif", function() {
      if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var notification = new Notification("You were mentioned by a user!");
      }
    })
    socket.on("disconnect", function() {
      var x = {client: "Client", color: "red", data: "You have disconnected...re-establishing connection"}
      var y = this.state.messages;
      y.push(x);
      this.setState({status: "disconnected", messages: y});
      this.updateMessages();
    }.bind(this))
    socket.on("message", function(message) {
      var data = this.state.messages;
      data.push(message);
      this.setState({messages: data});
      console.log(message);
      this.updateMessages();
    }.bind(this));
  }

  updateMessages() {
    var messages = this.state.messages.map(message => {
      return (<tr key={message.client}>
        <td>
          <p style={{fontSize: 12}}><span style={{color: message.color}}>Anonymous <small style={{fontSize: 12}}><code>id: {message.client}</code></small></span>: <span>{message.data}</span></p> 
        </td>
      </tr>)
    });

    var view = (
      <div style={{height: "90%"}}>
      <div style={{height: "100%", overflowY: "auto", width: "100%"}} id="data">
    <Table size="sm">
      <thead>
        <tr>
        </tr>
      </thead>
      <tbody>
        {messages}
      </tbody>
    </Table>
        </div></div>);
    this.setState({screen: "messages", messageView: view});

    var elem = document.getElementById('data');
    elem.scrollTop = elem.scrollHeight;
  }

  sendMessage(event) {
    event.preventDefault();
    var socket = this.state.iosocket;
    var algorithm = 'aes-256-ctr';
    var x = createCipher(algorithm, this.state.crypto);
    var y = x.update(this.state.input, 'utf8', 'hex');
    var data = {
      client: this.state.id,
      color: this.state.color,
      data: y
    };
    if (data.data.length >= 1 && data.data.length <= 250) {
      socket.emit("message", data);
    }
    this.setState({input: ""})
  }

  handleTextTyping(event) {
    this.setState({input: event.target.value});
    event.preventDefault();
  }

  render() {
    var screen = "null";
    if (this.state.screen === "init") {
      screen =  (
        <div style={{height: "100%", width: "100%"}}>
          <Navbar dark expand="md">
            <NavbarBrand>Messages</NavbarBrand>
            <small>server: <code>{this.state.url}</code> anonid: <code>{this.state.id}</code> <span>status</span>: <code>{this.state.status}</code></small>
          </Navbar>
          <div className="footform" style={{width: "100%", display: "block", position: "absolute", bottom: 0, height: 45}}>
            <Form onSubmit={this.sendMessage} inline style={{width: "100%"}}>
            <FormGroup style={{width: "100%"}}>
              <Input style={{width: "80%"}} type="text" name="text" id="text" placeholder="Place message here..." onChange={this.handleTextTyping} style={{marginLeft: 20}} value={this.state.input} /><Button type="submit" style={{marginLeft: 20}} value="Submit">Send message</Button>
            </FormGroup>
            </Form>
          </div>
        </div>
      )
    } else if (this.state.screen === "messages") {
      screen = (
        <div style={{height: "100%", width: "100%"}}>
          <Navbar dark expand="md">
            <NavbarBrand>Messages</NavbarBrand>
            <small>server: <code>{this.state.url}</code> anonid: <code>{this.state.id}</code> <span>status</span>: <code>{this.state.status}</code></small>
          </Navbar>
          {this.state.messageView}
            <div className="footform" style={{width: "100%", display: "block", position: "absolute", bottom: 0, height: 45}}>
            <Form onSubmit={this.sendMessage} inline style={{width: "100%"}}>
            <FormGroup style={{width: "100%"}}>
              <Input style={{width: "80%"}} type="text" name="text" id="text" placeholder="Place message here..." onChange={this.handleTextTyping} style={{marginLeft: 20}} value={this.state.input} /><Button type="submit" style={{marginLeft: 20}} value="Submit">Send message</Button>
            </FormGroup>
            </Form>
          </div>
        </div>
      )
    }
    return (
      <div className="App">
        {screen}
      </div>
    );
  }
}