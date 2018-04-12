import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import openSocket from "socket.io-client";
import { createCipher, createHash, privateEncrypt, publicDecrypt } from "crypto-browserify";
import "./Chat.css";
import {
  Table,
  Input,
  InputGroupAddon,
  Button,
  Form,
  FormGroup,
  Navbar,
  NavbarBrand,
  InputGroup
} from "reactstrap";
import { Message } from "./Message";
import { Buffer } from 'buffer';
import { setTimeout } from "timers";

var keypair = require('keypair')

var genkeys = function () {
    var pair = keypair();
    return pair || { public: "fail", private: "fail" }
}

const b64DecodeUnicode = function(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(
    atob(str)
      .split("")
      .map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
};

const encryptMessage = function(message, key) {
  const buffer = new Buffer(message.data);
  var encrypted = privateEncrypt(key, buffer)
  return encrypted.toString("base64");
}

const decryptMessage = function(message, key) {
  try {
    key = key ? key : localStorage.getItem("pubkey")
    const buffer = new Buffer(message.data, "base64");
    var decrypted = publicDecrypt(key, buffer);
    return decrypted.toString("utf8")
  } catch (err) {
    return message.data
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export class Chat extends Component {
  constructor(props) {
    super(props);
    const url = this.props.url;
      const socket = openSocket(b64DecodeUnicode(url), { secure: true });

    this.state = {
      url: b64DecodeUnicode(url),
      screen: "init",
      screenshow: null,
      input: "",
      id: "",
      color: "",
      crypto: "",
      status: "connecting",
      iosocket: socket,
      messages: [],
      messageView: null,
      key: Math.random(),
      servkey: ''
    };
    this.updateMessages = this.updateMessages.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.handleTextTyping = this.handleTextTyping.bind(this);

    var server = this.props.url
    var serverconf = localStorage.getItem(server)
    if (serverconf) {
      socket.emit("identification", serverconf);
    } else {
      socket.emit("noid");
    }

    socket.on("reconnect", function() {
      var server = this.props.url;
      var serverconf = localStorage.getItem(server);
      if (serverconf) {
        socket.emit("identification", serverconf);
      } else {
        socket.emit("noid");
      }
    }.bind(this));

    socket.on("serverinfo", function(info) {
      this.setState({serverinfo: info})
    }.bind(this))

    socket.on(
      "version",
      function(v) {
        if (v > parseFloat(localStorage.getItem("version"))) {
          navigator.serviceWorker
            .getRegistrations()
            .then(function(registrations) {
              for (let registration of registrations) {
                registration.unregister();
              }
            });
          localStorage.setItem("updated", "true");
          window.location.reload();
        } else {
          if (localStorage.getItem("updated") === "true") {
            this.setState({ updated: true });
            localStorage.removeItem("updated");
          }
        }
      }.bind(this)
    );
    socket.on("identification", function(identification) {
      /*
        var config = JSON.parse(localStorage.getItem("config"));
        var servers = config.servers;
        var server = {id: url, token: identification.token}
        try {
          var originalserver = servers.filter(function(server) {
            return server.id === window.location.pathname.split("/")[window.location.pathname.split("/").length -1];
          }.bind(this))[0];
          servers.splice(servers.indexOf(originalserver), 1);
          console.log("removed original server")
        } catch(err) {

        }
        servers.push(server);
        config = {servers: servers};
        config = JSON.stringify(config)
        localStorage.setItem("config", config);
        */
       var server = this.props.url;
       localStorage.setItem(this.props.url, identification.token);
        this.setState({
          id: identification.id,
          color: identification.color,
          token: identification.token,
          status: "getting messages"
        });
        this.props.resetRooms("x");

        this.state.iosocket.emit("clientkey", localStorage.getItem("pubkey"));
      }.bind(this));
    socket.on("servkey", function(key) {
      this.setState({
        servkey: key
      });
    }.bind(this))
    socket.on(
      "messagelist",
      function(data) {
        this.setState({ messages: data, status: "connected" });
      }.bind(this)
    );
    socket.on("notif", function() {
      if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var notification = new Notification("You were mentioned by a user!");
      }
    });
    socket.on(
      "disconnect",
      function() {
        var x = {
          id: String(Date.now() +""+getRandomInt(10000, 99999)),
          client: "Client",
          color: "red",
          room: "#all",
          data: "You have disconnected...re-establishing connection"
        };
        var y = this.state.messages;
        y.push(x);
        this.setState({ status: "disconnected", messages: y });
        this.updateMessages();
      }.bind(this)
    );
    socket.on(
      "message",
      function(message) {
        // TODO: decrypt all messages (see server.js TODO)
        if (this.state.serverinfo.encrypt === "true") message.data = decryptMessage(message, this.state.servkey);
        var data = this.state.messages;
        data.push(message);
        this.setState({ messages: data });
        this.updateMessages();
      }.bind(this)
    );
    socket.on(
      "join",
      function(room) {
        this.props.joinRoom(room);
      }.bind(this)
    );
    socket.on("leave", function(room) {
      console.log(room);
      if (this.props.rooms.length === 1) {
        var messages = this.state.messages;
        var newMessage = {
          id: String(Date.now() + "" + getRandomInt(10000, 99999)),
          client: "Client",
          color: "red",
          room: room,
          data: "Rejoining room"
        };
        messages.push(newMessage);
        this.setState({
          messages: messages
        });
        var data = { id: String(Date.now() +""+getRandomInt(10000, 99999)), token: this.state.token, room: this.props.room, data: `/join ${room}` };
        socket.emit("message", data)
      } else {
        this.props.leaveRoom(room);
      }
    }.bind(this))
    this.updateScreen = this.updateScreen.bind(this);
  }

  componentDidMount() {
    console.log("cdm")
    var screen = (
    <div style={{ width: "100%", height: "inherit" }}>
          {this.state.messageView}
          <div className="footform" style={{ width: "100%", display: "block", position: "absolute", bottom: 0, height: 50 }}>
            <Form
              autoComplete="off"
              onSubmit={this.sendMessage}
              inline
              style={{
                width: "100%"
              }}
            >
              <FormGroup
                style={{
                  width: "100%"
                }}
              >
                <Input
                  style={{
                    width: "100%"
                  }}
                  type="text"
                  name="text"
                  id="text"
                  placeholder="Place message here..."
                  onChange={this.handleTextTyping}
                  style={{
                    marginLeft: 20, marginTop: 5
                  }}
                  value={this.state.input}
                />
              </FormGroup>
            </Form>
          </div>
                </div> )
      this.setState({screenshow: screen})
    window.addEventListener("resize", this.updateScreen);
  }


  updateScreen() {
    var screen = (
      <div style={{ width: "100%", height: "inherit" }}>
          {this.state.messageView}
                </div> )
      this.setState({screenshow: screen})
    try {
      var elem = document.getElementById("data");
      elem.scrollTop = elem.scrollHeight;
    } catch(err) {

    }
  }

  updateMessages() {
    var messages = this.state.messages.map(message => {
      return (<Message message={message} room={this.props.room} />)
    });

    var view = <div id="data" style={{overflowY: "auto", height: window.innerHeight - 100 }}>{messages}</div>
    this.setState({
      screen: "messages",
      messageView: view,
      key: Math.random()
    });
    try {
      var elem = document.getElementById("data");
      elem.scrollTop = elem.scrollHeight;
    } catch(err) {

    }
    setTimeout(this.updateScreen(), 100)
  }

  sendMessage(event) {
    event.preventDefault();
    var socket = this.state.iosocket;
    /** TODO: Send messages encrypted
      var algorithm = 'aes-256-ctr';
      var x = createCipher(algorithm, this.state.crypto);
      var y = x.update(this.state.input, 'utf8', 'hex');
    */
    var config = JSON.parse(localStorage.getItem("config"));
    var servers = config.servers;
    var server = servers.filter(function(server) {
      return server.id === this.props.url;
    }.bind(this))[0];
    var x = this.state.input;
    var room = x.split(" ")[1];
    if (this.state.input === "/reset") {
        socket.emit("noid");
        var messages = this.state.messages;
        var newMessage = {
            id: String(Date.now() + "" + getRandomInt(10000, 99999)),
            client: "Client",
            color: "red",
            room: "#all",
            data: "Reset user data."
        };
        messages.push(newMessage);
        this.setState({ messages: messages });
    } else if (this.state.input === '/newkeys') {
        var messages = this.state.messages;
        var newMessage = {
            id: String(Date.now() + "" + getRandomInt(10000, 99999)),
            client: "Client",
            color: "red",
            room: "#all",
            data: "Created new keys"
        };
        messages.push(newMessage);
        this.setState({ messages: messages });
        var keypair = genkeys();
        localStorage.setItem('pubkey', keypair.public)
        localStorage.setItem('privkey', keypair.private)
        socket.emit("clientkey", localStorage.getItem("pubkey"));
    }
    else if ((!this.state.input.startsWith("/switch") || this.props.rooms.indexOf(room) === -1) && this.state.input) {
      if (this.state.input.startsWith("/nick")) {
        var nick = x.split("/nick ")[1];
        socket.emit("nick", nick);
        var messages = this.state.messages;
        var newMessage = {
          id: String(Date.now() +""+getRandomInt(10000, 99999)),
          client: "Client",
          color: "red",
          room: room,
          data: "Requested nickname change"
        };
        messages.push(newMessage);
        this.setState({ messages: messages });
      } else if (this.state.input.startsWith('/whisper')) {
        var input = this.state.input
        var user = input.split(' ')[1]
        var data = input.split('/whisper '+user+' ')[1]
        var message = {reciever: user, data: data}
        socket.emit('whisper', message)
      } else if (this.state.input.startsWith('/setimg')) {
        var img = this.state.input.split(' ')[1]
        socket.emit('setimg',img)
      } else {
        var data = { id: String(Date.now() +""+getRandomInt(10000, 99999)), room: this.props.room, data: this.state.input };
        if (this.state.serverinfo.version < 11) {
          console.log("lower version")
          data.token = this.state.token
        }
        if (this.state.serverinfo.encrypt === "true") {
          console.log("sending encrypted message")
          data.data = encryptMessage(data, localStorage.getItem("privkey"));
        }
        socket.emit("message", data);
      }
    } else if(this.state.input.startsWith("/switch") && this.props.rooms.indexOf(room) > -1) {
      var x = this.state.input;
      var room = x.split(" ")[1];
      this.setState({ messageView: <p>Perfoming room change</p> });
        console.log("Changing room...");
        this.props.switchRoom(room);
        var messages = this.state.messages;
        var newMessage = {
          id: String(Date.now() +""+getRandomInt(10000, 99999)),
          client: "Client",
          color: "red",
          room: room,
          data: "Switched to room: " + room
        };
        messages.push(newMessage);
        this.setState({ messages: messages });
        // Wait for everything to update then reload messages
        setTimeout(this.updateMessages, 10)
    }
    this.setState({ input: "" });
  }

  handleTextTyping(event) {
    this.setState({ input: event.target.value });
    event.preventDefault();
  }

  render() {
    //this.updateMessages();
    //this.updateScreen();
    return <div style={{ height: "100%" }} className="text-white bg-dark">
    {this.state.screenshow}
    <div className="footform" style={{ width: "100%", display: "block", position: "absolute", bottom: 0, height: 50, borderTop: "1px solid rgb(238, 238, 238)" }}>
            <Form
              autoComplete="off"
              onSubmit={this.sendMessage}
              inline
              style={{
                width: "100%"
              }}
            >
              <FormGroup
                style={{
                  width: "100%"
                }}
              >
                <Input
                  style={{
                    width: "100%"
                  }}
                  type="text"
                  name="text"
                  id="text"
                  placeholder="Place message here..."
                  onChange={this.handleTextTyping}
                  style={{
                    marginLeft: 20, marginTop: 5
                  }}
                  value={this.state.input}
                />
              </FormGroup>
            </Form>
          </div></div>;
  }
}
