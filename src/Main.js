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
    if(!localStorage.getItem("config")) {
      var config = {servers: []};
      var json = JSON.stringify(config);
      localStorage.setItem("config", json);
    }

    this.state = { rooms: ["#default"], room: 0, server: this.props.match.params.url, roomName: "", roomview: <div>
          <h2 style={{ paddingLeft: 20 }}>Rooms</h2>
          <p style={{ paddingLeft: 20 }}>#default</p>
        </div>, screen: null };
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
    this.leaveRoom = this.leaveRoom.bind(this);
    document.title = "Riddlet - #default";
  }

  componentDidMount() {
    this.renderRooms();
    var screen = <div style={{ height: "100%", width: "100%" }}>
        <Navbar expand="md" style={{ borderBottom: "1px solid #eeeeee", height: 50 }}>
          <NavbarBrand>
            <img alt="logo" src={logo} height="50" />
          </NavbarBrand>
          <a href="https://riddlet-docs.afroraydude.com/client-commands" target="_blank">
            Commands
          </a>
        </Navbar>
        <div style={{ height: window.innerHeight - 50, width: "100%", overflow: "hidden", marginRight: -15 }} className="row no-gutters">
          <div className="col-sm-2 d-xs-none d-sm-none d-md-block col-md-2 no-gutters" style={{ height: "100%" }}>
            {this.state.roomview}
          </div>
          <div className="col-xs-12 col-md-10 no-gutters" style={{ height: "100%", borderLeft: "1px solid #eeeeee", overflow: "auto" }}>
            <Chat rooms={this.state.rooms} room={this.state.roomName} url={this.state.server} switchRoom={this.switchRoom} joinRoom={this.joinRoom} resetRooms={this.resetRooms} leaveRoom={this.leaveRoom} />
          </div>
        </div>
      </div>;
      this.updateScreen = this.updateScreen.bind(this)
    this.setState({ roomName: this.state.rooms[this.state.room], screen: screen });
    window.addEventListener("resize", this.updateScreen);
  }

  updateScreen() {
    var screen = <div style={{ height: "100%", width: "100%" }}>
        <Navbar expand="md" style={{ borderBottom: "1px solid #eeeeee", height: 50 }}>
          <NavbarBrand>
            <img alt="logo" src={logo} height="50" />
          </NavbarBrand>
          <a href="https://riddlet-docs.afroraydude.com/client-commands" target="_blank">
            Commands
          </a>
        </Navbar>
        <div style={{ height: window.innerHeight - 50, width: "100%", overflow: "hidden", marginRight: -15 }} className="row no-gutters">
          <div className="d-xs-none d-sm-none d-md-block col-md-2 no-gutters" style={{ height: "100%" }}>
            {this.state.roomview}
          </div>
          <div className="col-xs-12 col-md-10 no-gutters" style={{ height: "100%", borderLeft: "1px solid #eeeeee", overflow: "auto" }}>
            <Chat rooms={this.state.rooms} room={this.state.roomName} url={this.state.server} switchRoom={this.switchRoom} joinRoom={this.joinRoom} resetRooms={this.resetRooms} leaveRoom={this.leaveRoom} />
          </div>
        </div>
      </div>;
      this.setState({ screen: screen });
  }

  resetRooms(x) {
    if (x) {
      var x = ["#default"];
      this.setState({ rooms: x });
      this.renderRooms("x");
      document.title = "Riddlet - #default";
    }
  }

  renderRooms() {
      var rooms = this.state.rooms.map(room => {
          if (room === this.state.roomName) {
              console.log(room)
              return <small style={{ paddingLeft: 20 }} key={room}>
                  <b>{room}</b>
                  <br />
              </small>
          } else {
              return <small style={{ paddingLeft: 20 }} key={room}>
                  {room}
                  <br />
              </small>
          }
    });
    const view = <div>
        <h3 style={{ paddingLeft: 20 }}>Rooms</h3>
        {rooms}
      </div>;
    this.setState({ roomview: view })
    this.updateScreen();
  }

  switchRoom(room) {
      const x = this.state.rooms.indexOf(room);
      this.setState({ roomName: room });
      setTimeout(function(){
        document.title = "Riddlet - " + this.state.roomName;
          setTimeout(function () {
              this.renderRooms()
        }.bind(this), 500)
      }.bind(this), 250)
  }

  joinRoom(room) {
    if (room) {
      if (this.state.rooms.indexOf(room) === -1) {
        var x = this.state.rooms;
        x.push(room);
        this.setState({ rooms: x });
        this.switchRoom(room)
      }
      this.renderRooms()
    }
  }

  leaveRoom(room) {
    if (room) {
      if (this.state.rooms.indexOf(room) > -1) {
        var x = this.state.rooms;
        x.splice(x.indexOf(room), 1);
        this.setState({rooms: x, room: 0, roomName: x[0]});
        setTimeout(this.renderRooms, 100);
      } else {
      }
    }
  }

  render() {
    var x = this.props.match.params.url;
    return (
      <div id="app" style={{ height: "100%", width: "100%" }}>
      {this.state.screen}
      </div>
    )
  }
}