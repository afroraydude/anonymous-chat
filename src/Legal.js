import React, { Component } from "react";
import "./App.css";
import openSocket from "socket.io-client";
import { createCipher, createHash } from "crypto-browserify";
import "./Chat.css";
import logo from "./logo.png";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

export class Legal extends Component {
  render() {
    return <div class="container">
        <div class="center">
          <h1 style={{ marginBottom: 50 }}>Legal</h1>
          <h2>Licence</h2>
        </div>
        <p>
          Copyright 2018 afroraydude
          <br />
          Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
          <br />
          <span style={{paddingLeft: "10em"}}>http://www.apache.org/licenses/LICENSE-2.0"</span>
          <br />
          Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
        </p>
      </div>;
  }
}