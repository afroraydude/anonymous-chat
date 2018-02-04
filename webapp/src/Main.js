import React, { Component } from 'react';
import {Chat} from './Chat';
import {
  Table,
  Input,
  Button,
  Form,
  FormGroup,
  Navbar,
  NavbarBrand
} from 'reactstrap';
  const b64DecodeUnicode = function(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

export class Main extends Component {
  constructor(props) {
    super(props)
    this.state = {rooms: ['#default'], room: 0, roomName: "", roomview: <div><p>#default</p></div>}
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
  }

  componentDidMount() {
    this.renderRooms("x");
    this.setState({roomName: this.state.rooms[this.state.room]})
  }

  resetRooms(x) {
    if (x) {
      var x = ["#default"]
      this.setState({rooms: x});
      this.renderRooms();
    }
  }

  joinRoom(room) {
    if (room) {
      var x = this.state.rooms;
      x.push(room);
      this.setState({rooms: x});
      this.renderRooms("x");
    }
  }



  renderRooms(x) {
    if(x) {
      var rooms = this.state.rooms.map(room => {
        if(this.state.rooms.indexOf(room) === this.state.room) {
          return (
            <p style={{color: "red"}}>{room}<br/></p>
          )
        } else {
          console.log(this.state.rooms.indexOf(room) + " " + this.state.room)
          return (
            <p>{room}<br/></p>
          )
        }
      });
      const view = <div>{rooms}</div>
      this.setState({roomview: view})
    }
  }

  render() {
    var x = this.props.match.params.url;
    return (
      <div style={{height:"100%",width:"100%", overflowY:"hidden"}}>
        <Navbar dark expand="md">
            <NavbarBrand>Messages</NavbarBrand>
            <small>server: <code>{x}</code> room: <code>{this.state.rooms[this.state.room]}</code></small>
        </Navbar>
        <div style={{height:"100%",width:"100%"}} className="container-fluid row">
          <div className="col-md-1">
            {this.state.roomview}
          </div>
          <div style={{height:"90%"}} className="col-md-11">
            <Chat url={x} joinRoom={this.joinRoom} resetRooms={this.resetRooms} room={this.state.roomName} />
          </div>
        </div>
      </div>
    );
  }
}