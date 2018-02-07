import React, {Component} from 'react'

export class Message extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    var message = this.props.message;
    var output;
    if (message.room === this.props.room || message.room === "#all") {
      if (message.data.includes("riddlet://")) {
        var x = message.data.split("riddlet://")[0];
        var y = message.data.split("riddlet://")[1];
        console.log(message.color)
        var z = y.split(" ")[1];
        y = y.split(" ")[0];
        output = (<div key={message.id} style={{ fontSize: 12 }}>
            <span style={{ color: message.color }}>
              Anonymous <small>
                <code>[{message.client}]</code>
              </small>
            </span>: <span>{x}</span>
            <a href={"riddlet://" + y}>
              Click to open server invite link in the Riddlet desktop
              application
            </a> <span>{z}</span>
          </div>);
      } else if (message.data.includes("ironchat://")) {
        var x = message.data.split("ironchat://")[0];
        var y = message.data.split("ironchat://")[1];
        var z = y.split(" ")[1];
        y = y.split(" ")[0];
        output = <div key={message.id} style={{ fontSize: 12 }}>
            <span style={{ color: message.color }}>
              Anonymous <small>
                <code>[{message.client}]</code>
              </small>
            </span>: <span>{x}</span>
            <a href={"ironchat://" + y}>
              Click to open server invite link in the Riddlet desktop
              application
            </a> <span>{z}</span>
          </div>;
      } else {
        output = <div key={message.id} style={{ fontSize: 12 }}>
            <span style={{ color: message.color }}>
              Anonymous <small>
                <code>[{message.client}]</code>
              </small>
            </span>: <span>{message.data}</span>
          </div>;
      }
      return (
        <div style={{padding: 10, borderBottom: "1px solid #eeeeee"}}>{output}</div>
      )
    } else {
      console.log("Message " + message.id + " is from a different channel");
      return null
    }
  }

}