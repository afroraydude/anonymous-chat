import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import openSocket from "socket.io-client";
import { createCipher, createHash } from "crypto-browserify";
import "./Chat.css";
import {
  Table,
  Input,
  Button,
  Form,
  FormGroup,
  Navbar,
  NavbarBrand
} from "reactstrap";

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

export class Chat extends Component {
  constructor(props) {
    super(props);
    console.log(this.props.url);
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
      messageView: <div />,
      key: Math.random()
    };
    this.updateMessages = this.updateMessages.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.handleTextTyping = this.handleTextTyping.bind(this);
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
    socket.on(
      "identification",
      function(identification) {
        console.log(identification);
        this.setState({
          id: identification.id,
          color: identification.color,
          crypto: identification.crypto,
          status: "getting messages"
        });
        this.props.resetRooms("x");
      }.bind(this)
    );
    socket.on(
      "messagelist",
      function(data) {
        console.log(data);
        this.setState({ messages: data, status: "connected" });
        this.updateMessages();
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
          id: String(Date.now()),
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
  }

  updateMessages() {
    var messages = this.state.messages.map(message => {
      if (message.room === this.props.room || message.room === "#all") {
        if (message.data.includes("riddlet://")) {
          var x = message.data.split("riddlet://")[0];
          var y = message.data.split("riddlet://")[1];
          var z = y.split(" ")[1];
          y = y.split(" ")[0]
          return (
          <p
            key={createHash("md5")
              .update(message.id)
              .digest("hex")}
            style={{ fontSize: 12 }}
          >
            <span style={{ color: message.color }}>
              Anonymous{" "}
              <small>
                <code>[{message.client}]</code>
              </small>
            </span>: <span>{x}</span><a href={"riddlet://"+y}>Click to open server invite link in the Riddlet desktop application</a> <span>{z}</span>
          </p>
        );
        } else if (message.data.includes("ironchat://")) {
          var x = message.data.split("ironchat://")[0];
          var y = message.data.split("ironchat://")[1];
          var z = y.split(" ")[1];
          y = y.split(" ")[0]
          return (
          <p
            key={createHash("md5")
              .update(message.id)
              .digest("hex")}
            style={{ fontSize: 12 }}
          >
            <span style={{ color: message.color }}>
              Anonymous{" "}
              <small>
                <code>[{message.client}]</code>
              </small>
            </span>: <span>{x}</span><a href={"ironchat://"+y}>Click to open server invite link in the Riddlet desktop application</a> <span>{z}</span>
          </p>
        );
        } else {
        return (
          <p
            key={createHash("md5")
              .update(message.id)
              .digest("hex")}
            style={{ fontSize: 12 }}
          >
            <span style={{ color: message.color }}>
              Anonymous{" "}
              <small>
                <code>[{message.client}]</code>
              </small>
            </span>: <span>{message.data}</span>
          </p>
        );
        }
      } else {
        console.log(
          "Message " +
            createHash("md5")
              .update(message.id)
              .digest("hex") +
            " is from a different channel"
        );
      }
    });

    var view = (
      <div key={this.state.key}>
        <div id="data">{messages}</div>
      </div>
    );
    this.setState({
      screen: "messages",
      messageView: view,
      key: Math.random()
    });
    var elem = document.getElementById("data");
    elem.scrollTop = elem.scrollHeight;
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
    var x = this.state.input;
    var room = x.split(" ")[1];
    if (!this.state.input.startsWith("/switch") || this.props.rooms.indexOf(room) === -1) {
      var data = { id: String(Date.now()), client: this.state.id, color: this.state.color, room: this.props.room, data: this.state.input };
      console.log("did send message");
      socket.emit("message", data);
    } else {
      var x = this.state.input;
      var room = x.split(" ")[1];
      this.setState({ messageView: <p>Perfoming room change</p> });
        console.log("Changing room...");
        this.props.switchRoom(room);
        var messages = this.state.messages;
        var newMessage = { id: String(Date.now()), client: "Client", color: "red", room: room, data: "Switched to room: " + room };
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
    var screen = "null";
    if (this.state.screen === "init") {
      screen = (
        <div
          style={{
            height: "100%",
            width: "100%"
          }}
        >
          <div
            className="footform"
            style={{
              width: "100%",
              display: "block",
              position: "absolute",
              bottom: 0,
              height: 45
            }}
          >
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
                    marginLeft: 20
                  }}
                  value={this.state.input}
                />
              </FormGroup>
            </Form>
          </div>
        </div>
      );
    } else if (this.state.screen === "messages") {
      screen = (
        <div
          style={{
            width: "100%",
            height: "90%",
            overflowY: "scroll"
          }}
          id="data"
        >
          {this.state.messageView}
          <div
            className="footform"
            style={{
              width: "100%",
              display: "block",
              position: "absolute",
              bottom: 0,
              height: 45
            }}
          >
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
                    marginLeft: 20
                  }}
                  value={this.state.input}
                />
              </FormGroup>
            </Form>
          </div>
        </div>
      );
    }
    return <div style={{ height: "100%" }}>{screen}</div>;
  }
}