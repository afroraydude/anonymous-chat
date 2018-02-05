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

export class ChatTable extends Component {
  constructor(props) {
    super(props);
    this.state = {messageView: <p>Loading...</p>}
    this.updateMessages = this.updateMessages.bind(this)
    this.updateMessages();
  }

  updateMessages() {
    var messages = this.props.messages.map(message => {
      console.log("Picking out new message")
      if (message.room === this.props.room || message.room === "#all") {
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
      messageView: view,
      key: Math.random()
    });
    var elem = document.getElementById("data");
    try {
      elem.scrollTop = elem.scrollHeight;
    } catch(err) {
      console.log("Haven't rendered the table yet")
    }
  }

  componentDidMount() {
    this.updateMessages()
  }

  render() {
    return (
      <div style={{height: "100%", width: "100%"}}>{this.state.messageView}</div>
    )
  }
}
