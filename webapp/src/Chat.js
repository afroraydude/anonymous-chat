import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import openSocket from "socket.io-client";
import { createCipher, createHash } from "crypto-browserify";
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

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export class Chat extends Component {
  constructor(props) {
    super(props);
    console.log(this.props.url);
    const url = this.props.url;
    console.log(b64DecodeUnicode(url));
    const socket = openSocket(b64DecodeUnicode(url), {secure: true});

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
      key: Math.random()
    };
    this.updateMessages = this.updateMessages.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.handleTextTyping = this.handleTextTyping.bind(this);

    var config = JSON.parse(localStorage.getItem("config"));
    var servers = config.servers;
    var server = servers.filter(function(server) {
        return server.id === window.location.pathname.split("/")[window.location.pathname.split("/").length - 1];
      }.bind(this))[0];
    if (server) {
      socket.emit("identification", server.token);
    } else {
      socket.emit("noid");
    }

    socket.on("reconnect", function() {
      var config = JSON.parse(localStorage.getItem("config"));
      var servers = config.servers;
      var server = servers.filter(function(server) {
          return server.id === window.location.pathname.split("/")[window.location.pathname.split("/").length - 1];
        }.bind(this))[0];
      if (server) {
        socket.emit("identification", server.token);
      } else {
        socket.emit("noid");
      }
    });

    socket.on(
      "version",
      function(v) {
        if (v > parseInt(localStorage.getItem("version"))) {
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
        console.log(identification);
        var config = JSON.parse(localStorage.getItem("config"));
        var servers = config.servers;
        var server = {id: url, token: identification.token}
        try {
          var originalserver = servers.filter(function(server) {
            console.log(window.location.pathname.split("/")[window.location.pathname.split("/").length -1])
            return server.id === window.location.pathname.split("/")[window.location.pathname.split("/").length -1];
          }.bind(this))[0];
          servers.splice(servers.indexOf(originalserver), 1);
        } catch(err) {

        }
        servers.push(server);
        config = {servers: servers};
        config = JSON.stringify(config)
        console.log(config)
        localStorage.setItem("config", config);
        this.setState({
          id: identification.id,
          color: identification.color,
          token: identification.token,
          status: "getting messages"
        });
        this.props.resetRooms("x");
      }.bind(this));
    socket.on(
      "messagelist",
      function(data) {
        console.log(data);
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
        var data = this.state.messages;
        data.push(message);
        this.setState({ messages: data });
        console.log(message);
        this.updateMessages();
      }.bind(this)
    );
    socket.on(
      "join",
      function(room) {
        console.log(room);
        this.props.joinRoom(room);
      }.bind(this)
    );
    socket.on("leave", function(room) {
      console.log(room);
      if (this.props.rooms.length === 1) {
        console.log("WOAH THERE IS ONLY ONE ROOM");
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
        var data = { id: String(Date.now() +""+getRandomInt(10000, 99999)), token: server.token, room: this.props.room, data: `/join ${room}` };
        socket.emit("message", data)
      } else {
        console.log("deleting room from list")
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
    console.log("us")
    var screen = (
      <div style={{ width: "100%", height: "inherit" }}>
          {this.state.messageView}
                </div> )
      this.setState({screenshow: screen})
  }

  updateMessages() {
    console.log("um")
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
    console.log("Updated message display panel")
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
    if ((!this.state.input.startsWith("/switch") || this.props.rooms.indexOf(room) === -1) && this.state.input) {
      var data = { id: String(Date.now() +""+getRandomInt(10000, 99999)), token: server.token, room: this.props.room, data: this.state.input };
      console.log("did send message");
      socket.emit("message", data);
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
    console.log("r")
    return <div style={{ height: "100%" }}>
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