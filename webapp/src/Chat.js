import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import openSocket from 'socket.io-client';
import {createCipher, createHash} from 'crypto-browserify';
import './Chat.css';
import {
  Table,
  Input,
  Button,
  Form,
  FormGroup,
  Navbar,
  NavbarBrand
} from 'reactstrap';



const b64DecodeUnicode = function (str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

export class Chat extends Component {
  constructor(props) {
    super(props);
    console.log(this.props.url)
    const url = this.props.url;
    console.log(b64DecodeUnicode(url));
    const socket = openSocket(b64DecodeUnicode(url));
    this.state = {
      url: b64DecodeUnicode(url),
      screen: "init",
      input: "",
      id: "",
      color: "",
      crypto: "",
      status: "connecting",
      iosocket: socket,
      messages: [],
      messageView: <div></div>,
      key: Math.random()
    }
    this.updateMessages = this
      .updateMessages
      .bind(this);
    this.sendMessage = this
      .sendMessage
      .bind(this);
    this.handleTextTyping = this
      .handleTextTyping
      .bind(this);
    this.clearMessages = this.clearMessages.bind(this)
    socket.on("version", function (v) {
      if (v > parseInt(localStorage.getItem("version"))) {
        navigator
          .serviceWorker
          .getRegistrations()
          .then(function (registrations) {
            for (let registration of registrations) {
              registration.unregister();
            }
          });
        localStorage.setItem('updated', 'true');
        window
          .location
          .reload();
      } else {
        if (localStorage.getItem('updated') === 'true') {
          this.setState({updated: true});
          localStorage.removeItem('updated');
        }
      }
    }.bind(this))
    socket.on("identification", function (identification) {
      console.log(identification);
      this.setState({id: identification.id, color: identification.color, crypto: identification.crypto, status: "getting messages"});
      this.props.resetRooms("x");
    }.bind(this));
    socket.on("messagelist", function (data) {
      console.log(data);
      this.setState({messages: data, status: "connected"});
      this.updateMessages();
    }.bind(this))
    socket.on("notif", function () {
      if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var notification = new Notification("You were mentioned by a user!");
      }
    });
    socket.on("disconnect", function () {
      var x = {
        client: "Client",
        color: "red",
        data: "You have disconnected...re-establishing connection"
      }
      var y = this.state.messages;
      y.push(x);
      this.setState({status: "disconnected", messages: y});
      this.updateMessages();
    }.bind(this))
    socket.on("message", function (message) {
      // TODO: decrypt all messages (see server.js TODO)
      var data = this.state.messages;
      data.push(message);
      this.setState({messages: data});
      console.log(message);
      this.updateMessages();
    }.bind(this));
    socket.on("join", function(room) {
      console.log(room);
      this.props.joinRoom(room);
    }.bind(this))
  }

  updateMessages() {
    var messages = this
      .state
      .messages
      .map(message => {
        if (message.room === this.props.room || message.room === "#all") {
        return (
          <tr key={createHash('md5').update(String(Math.random())).digest("hex")} >
            <td className="noborder">
              <p style={{fontSize: 12}}><span style={{color: message.color}}>Anonymous <small style={{fontSize: 12}}><code>[{message.client}]</code></small></span>: <span>{message.data}</span>
              </p>
            </td>
          </tr>
        )
        } else {
          console.log("Message " + createHash('md5').update(message.data).digest("hex") + " is from a different channel")
        }
      });

    var view = (
      <div key={this.state.key}>
        <div id="data">
          <Table size="sm">
            <thead>
              <tr></tr>
            </thead>
            <tbody>
              {messages}
            </tbody>
          </Table>
        </div>
      </div>
    );
    this.setState({screen: "messages", messageView: view, key: Math.random()});
    var elem = document.getElementById('data');
    elem.scrollTop = elem.scrollHeight;
  }

  updateRoomMessages(room) {
    console.log("Switching to room "+room)
    this.setState({messageView: <p></p>})
    var messages = this
      .state
      .messages
      .map(message => {
        if (message.room === room || message.room === "#all") {
        return (
          <tr key={createHash('md5').update(String(Math.random())).digest("hex")} >
            <td className="noborder">
              <p style={{fontSize: 12}}><span style={{color: message.color}}>Anonymous <small style={{fontSize: 12}}><code>[{message.client}]</code></small></span>: <span>{message.data}</span>
              </p>
            </td>
          </tr>
        )
        } else {
          console.log("Message " + createHash('md5').update(message.data).digest("hex") + " is from a different channel")
        }
      });

    var view = (
      <div key={this.state.key}>
        <div id="data">
          <Table size="sm">
            <thead>
              <tr></tr>
            </thead>
            <tbody>
              {messages}
            </tbody>
          </Table>
        </div>
      </div>
    );
    this.setState({screen: "messages", messageView: view, key: Math.random()});
    var elem = document.getElementById('data');
    elem.scrollTop = elem.scrollHeight;
  }

  clearMessages() {
    this.setState({screen: "messages", messageView: <div></div>});
  }

  sendMessage(event) {
    event.preventDefault();
    var socket = this.state.iosocket;

    /** TODO: Send messages encrypted
      var algorithm = 'aes-256-ctr';
      var x = createCipher(algorithm, this.state.crypto);
      var y = x.update(this.state.input, 'utf8', 'hex');
    */
    if(!this.state.input.startsWith("/switch")) {
      var data = {
        client: this.state.id,
        color: this.state.color,
        room: this.props.room,
        data: this.state.input
      };
      if (this.state.input.length >= 1 && this.state.input.length <= 250) {
        console.log("did send message");
        socket.emit("message", data);
      } else {
        console.log("did not send message because " + this.state.input.length);
      }
    } else {
      var x = this.state.input;
      var room = x.split(" ")[1];
      if (room && this.props.rooms.indexOf(room) > -1) {
        this.updateRoomMessages(room);
        this.props.switchRoom(room);
        this.clearMessages();
        this.updateMessages();
        var messages = this.state.messages;
        var newMessage = {client: "Client", color:"red", room: room, data: "Switched to room: "+room}
        messages.push(newMessage);
        this.setState({messages:messages});
        this.updateMessages();
      }
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
      screen = (
        <div style={{
          height: "100%",
          width: "100%"
        }}>
          <div
            className="footform"
            style={{
            width: "100%",
            display: "block",
            position: "absolute",
            bottom: 0,
            height: 45
          }}>
            <Form autoComplete="off" onSubmit={this.sendMessage} inline style={{width: "100%"}}>
              <FormGroup style={{width: "100%"}}>
                <Input style={{width: "80%"}} type="text" name="text" id="text" placeholder="Place message here..." onChange={this.handleTextTyping} style={{marginLeft: 20}}
                  value={this.state.input}/>
                <Button type="submit" style={{marginLeft: 20}} value="Submit">Send message</Button>
              </FormGroup>
            </Form>
          </div>
        </div>
      )
    } else if (this.state.screen === "messages") {
      screen = (
        <div style={{
          width: "100%",
          height: "90%",
          overflowY: "scroll"
        }} id="data">
          {this.state.messageView}
          <div
            className="footform"
            style={{
            width: "100%",
            display: "block",
            position: "absolute",
            bottom: 0,
            height: 45
          }}>
            <Form
              autoComplete="off"
              onSubmit={this.sendMessage}
              inline
              style={{
              width: "100%"
            }}>
              <FormGroup style={{
                width: "100%"
              }}>
                <Input
                  style={{
                  width: "80%"
                }}
                  type="text"
                  name="text"
                  id="text"
                  placeholder="Place message here..."
                  onChange={this.handleTextTyping}
                  style={{
                  marginLeft: 20
                }}
                  value={this.state.input}/>
                <Button
                  type="submit"
                  style={{
                  marginLeft: 20
                }}
                  value="Submit">Send message</Button>
              </FormGroup>
            </Form>
          </div>
        </div>
      )
    }
    return (
      <div style={{height: "100%"}}>
        {screen}
      </div>
    );
  }
}