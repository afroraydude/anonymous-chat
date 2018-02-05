import React, { Component } from "react";
import { Chat } from "./Chat";
import {
  Table,
  Input,
  Button,
  Form,
  FormGroup,
  Navbar,
  NavbarBrand
} from "reactstrap";
import logo from "./logo.png";
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

export class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rooms: ["#default"],
      room: 0,
      roomName: "",
      roomview: (
        <div>
          <p>#default</p>
        </div>
      )
    };
    /** 
    var rooms = this.state.rooms.map(room => {
      return (
        <p>{room}<br/></p>
      )
    });
    const view = <div>{rooms}</div>
    this.setState({roomview: view})
    */
    this.joinRoom = this.joinRoom.bind(this);
    this.renderRooms = this.renderRooms.bind(this);
    this.resetRooms = this.resetRooms.bind(this);
    this.switchRoom = this.switchRoom.bind(this);
    document.title = "Riddlet - #default";
  }

  componentDidMount() {
    this.renderRooms("x");
    this.setState({ roomName: this.state.rooms[this.state.room] });
    console.log("ran a render");
  }

  resetRooms(x) {
    if (x) {
      var x = ["#default"];
      this.setState({ rooms: x });
      this.renderRooms("x");
      document.title = "Riddlet - #default";
    }
  }

  joinRoom(room) {
    if (room) {
      if (this.state.rooms.indexOf(room) === -1) {
        var x = this.state.rooms;
        x.push(room);
        this.setState({ rooms: x });
        this.renderRooms();
      }
    }
  }

  shouldComponentUpdate() {
    return true
    console.log("ran a render");
  }

  renderRooms() {
    var rooms = this.state.rooms.map(room => {
      return (
        <p key={room}>
          {room}
          <br />
        </p>
      );
    });
    const view = (
      <div>
        <h2>Rooms</h2>
        {rooms}
      </div>
    );
    this.setState({ roomview: view });
  }

  switchRoom(room) {
      const x = this.state.rooms.indexOf(room);
      this.setState({ room: x, roomName: this.state.rooms[x] });
      document.title = "Riddlet - " + room;
  }

  render() {
    var x = this.props.match.params.url;
    return (
      <div style={{ height: "100%", width: "100%"}}>
        <Navbar dark expand="md">
          <NavbarBrand>
            <img alt="logo" src={logo} width="250" />
          </NavbarBrand>
          <small>
            server: <code>riddlet://{x}</code> (<a href={"riddlet://"+x}>Click here to open in Desktop app</a>) room:{" "}
            <code>{this.state.rooms[this.state.room]}</code>
          </small>
        </Navbar>
        <div
          style={{ height: "86%", width: "100%" }}
          className="container-fluid row"
        >
          <div className="col-sm-4 col-md-2" style={{ height: "100%" }}>{this.state.roomview}</div>
          <div className="col-sm-8 col-md-10" style={{ height: "100%" }}>
            <Chat
              rooms={this.state.rooms}
              room={this.state.roomName}
              url={x}
              switchRoom={this.switchRoom}
              joinRoom={this.joinRoom}
              resetRooms={this.resetRooms}
            />
          </div>
        </div>
      </div>
    );
  }
}