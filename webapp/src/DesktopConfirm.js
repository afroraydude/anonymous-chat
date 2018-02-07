import React, { Component } from "react";
import "./App.css";
import openSocket from "socket.io-client";
import { createCipher, createHash } from "crypto-browserify";
import "./Chat.css";
import logo from "./logo.png";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';


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

export class DesktopConfirm extends Component {
  constructor(props) {
    super(props)
    const url = this.props.url || this.props.match.params.url;
    console.log(b64DecodeUnicode(url));
    const socket = openSocket(b64DecodeUnicode(url), {secure: true});
    socket.on("serverinfo", function(serverinfo) {
      console.log(serverinfo)
      this.setState({serverinfo: serverinfo})
    }.bind(this))
    var screen = "default";
    socket.on("connect_error", error => {
      screen = "fail"
    });
    this.join = this.join.bind(this)
    this.state = { modal: true, screen: screen, url: url };
  }

  join() {
    window.location.href = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/chat/" + this.state.url;
  }

  render() {
    var x = (
      <div class="center vertical">
        <img src={logo} alt="logo" />
        <h3 style={{ marginTop: 50 }}>Could not connect to server</h3>;
      </div>
    );
    if (this.state.serverinfo) {
    x = <Modal isOpen={this.state.modal} className={this.props.className}>
        <ModalBody>
          <div class="center">
            <img src={logo} alt="logo" />
            <h4 style={{marginTop: 50}}>Would you like to join this server?</h4>
            <br />
            <br />
            <div class="dclcontainer">
              <img className="dclogo" style={{margin: 25, borderStyle: "solid", maxHeight: 250, maxWidth: 250 }} src={this.state.serverinfo.logo} alt="server logo" />
            </div>
            <p>Name: {this.state.serverinfo.title}</p>
            <p>IP: {this.state.serverinfo.ip}</p>
            <p>User count: {this.state.serverinfo.users}</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.join}>
            Join Server
          </Button>
        </ModalFooter>
      </Modal>;
  }
    return (
      <div>{x}</div>
    )
  }
}